import json
import logging
import os
import re
import subprocess
import tempfile
import traceback
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
import requests

from .models import Course, Lesson, Progress
from .serializers import (
    CourseSerializer,
    LessonSerializer,
    ProgressSerializer,
    ProgressUpsertSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()


class LessonValidationView(APIView):
    permission_classes = (permissions.AllowAny,)
    
    # Configure logging
    logger = logging.getLogger(__name__)
    
    # Piston API endpoint
    PISTON_API_URL = "https://emkc.org/api/v2/piston/execute"
    
    def is_code_safe(self, code):
        """Check if Python code contains dangerous patterns"""
        dangerous_patterns = [
            r'import\s+os',           # os module
            r'import\s+sys',          # sys module
            r'import\s+subprocess',    # subprocess module
            r'import\s+shutil',        # shutil module
            r'import\s+glob',          # glob module
            r'from\s+os\s+import',     # from os import
            r'from\s+sys\s+import',    # from sys import
            r'from\s+subprocess\s+import',  # from subprocess import
            r'\bopen\s*\(',           # open() function
            r'\bfile\s*\(',           # file() function
            r'\bexec\s*\(',           # exec() function
            r'\beval\s*\(',           # eval() function
            r'\b__import__\s*\(',     # __import__() function
            r'\bcompile\s*\(',         # compile() function
            r'\bglobals\s*\(',         # globals() function
            r'\blocals\s*\(',          # locals() function
            r'\bvars\s*\(',            # vars() function
            r'\bdir\s*\(',            # dir() function
            r'\bgetattr\s*\(',         # getattr() function
            r'\bsetattr\s*\(',         # setattr() function
            r'\bdelattr\s*\(',         # delattr() function
            r'\bhasattr\s*\(',         # hasattr() function
            r'\bisinstance\s*\(',       # isinstance() function
            r'\bissubclass\s*\(',      # issubclass() function
            r'\bproperty\s*\(',         # property() function
            r'\bclassmethod\s*\(',      # classmethod() function
            r'\bstaticmethod\s*\(',     # staticmethod() function
            r'\bsuper\s*\(',            # super() function
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, code, re.IGNORECASE):
                return False, f"Dangerous pattern detected: {pattern}"
        
        return True, "Code is safe"
    
    def execute_python_code_safely(self, code):
        """Execute Python code safely using subprocess with timeout"""
        # Check if code is safe
        is_safe, safety_message = self.is_code_safe(code)
        if not is_safe:
            raise Exception(f"Code contains unsafe operations: {safety_message}")
        
        try:
            # Create a temporary file for the code
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_file:
                temp_file.write(code)
                temp_file_path = temp_file.name
            
            try:
                # Execute the code with timeout
                result = subprocess.run(
                    ['python', temp_file_path],
                    capture_output=True,
                    text=True,
                    timeout=5,  # 5 second timeout
                    cwd=tempfile.gettempdir()  # Run in temp directory
                )
                
                # Clean up the temporary file
                os.unlink(temp_file_path)
                
                return {
                    'run': {
                        'output': result.stdout,
                        'stderr': result.stderr,
                        'returncode': result.returncode
                    }
                }
                
            except subprocess.TimeoutExpired:
                # Clean up the temporary file
                try:
                    os.unlink(temp_file_path)
                except:
                    pass
                
                return {
                    'run': {
                        'output': '',
                        'stderr': 'Code execution timed out (5 seconds limit)',
                        'returncode': -1
                    }
                }
                
        except Exception as e:
            # Clean up the temporary file if it exists
            try:
                if 'temp_file_path' in locals():
                    os.unlink(temp_file_path)
            except:
                pass
            
            raise Exception(f"Failed to execute code: {str(e)}")
    
    def detect_language(self, lesson_content):
        """Detect programming language from lesson content"""
        if not lesson_content:
            return 'javascript'
        
        content_lower = lesson_content.lower()
        
        # Check for Python indicators
        python_indicators = ['python', 'def ', 'print(', 'import ', 'from ', '__main__']
        if any(indicator in content_lower for indicator in python_indicators):
            return 'python'
        
        # Default to JavaScript
        return 'javascript'
    
    def get_language_version(self, language):
        """Get appropriate language version for Piston API"""
        versions = {
            'python': '3.10.0',
            'javascript': '18.15.0'
        }
        return versions.get(language, '18.15.0')
    
    def get_file_extension(self, language):
        """Get file extension for the language"""
        extensions = {
            'python': 'py',
            'javascript': 'js'
        }
        return extensions.get(language, 'js')
    
    def execute_code_with_piston(self, code, language):
        """Execute code using Piston API"""
        print(f"[DEBUG] execute_code_with_piston called with language: {language}")
        print(f"[DEBUG] Code length: {len(code)}")
        
        # For Python, use safe subprocess execution instead of Piston API
        if language == 'python':
            print(f"[DEBUG] Using safe Python subprocess execution")
            return self.execute_python_code_safely(code)
        
        try:
            version = self.get_language_version(language)
            extension = self.get_file_extension(language)
            print(f"[DEBUG] Using version: {version}, extension: {extension}")
            
            payload = {
                "language": language,
                "version": version,
                "files": [
                    {
                        "name": f"main.{extension}",
                        "content": code
                    }
                ]
            }
            print(f"[DEBUG] Piston payload: {payload}")
            
            print(f"[DEBUG] Making request to {self.PISTON_API_URL}")
            response = requests.post(
                self.PISTON_API_URL,
                json=payload,
                timeout=30  # 30 second timeout
            )
            print(f"[DEBUG] Response status code: {response.status_code}")
            print(f"[DEBUG] Response headers: {dict(response.headers)}")
            
            response.raise_for_status()
            result = response.json()
            print(f"[DEBUG] Response JSON keys: {list(result.keys()) if result else 'None'}")
            print(f"[DEBUG] Full response: {result}")
            
            return result
            
        except requests.exceptions.Timeout:
            print(f"[DEBUG] Piston API timeout")
            self.logger.error("Piston API timeout")
            raise Exception("Code execution timed out. Please try again.")
        except requests.exceptions.RequestException as e:
            print(f"[DEBUG] Piston API request failed: {str(e)}")
            print(f"[DEBUG] Response content: {e.response.text if e.response else 'No response'}")
            self.logger.error(f"Piston API request failed: {e}")
            raise Exception("Failed to execute code. Please try again.")
        except json.JSONDecodeError as e:
            print(f"[DEBUG] JSON decode error: {str(e)}")
            print(f"[DEBUG] Response text: {e.doc if hasattr(e, 'doc') else 'No doc'}")
            self.logger.error(f"Piston API JSON decode error: {e}")
            raise Exception("Invalid response from code execution service.")
    
    def post(self, request, id):
        print(f"[DEBUG] LessonValidationView.post called with id: {id}")
        print(f"[DEBUG] Request data: {request.data}")
        
        try:
            try:
                print(f"[DEBUG] Attempting to get lesson {id}")
                lesson = Lesson.objects.get(id=id)
                print(f"[DEBUG] Found lesson: {lesson.title}")
            except Lesson.DoesNotExist:
                print(f"[DEBUG] Lesson {id} does not exist")
                return Response(
                    {"success": False, "message": "Lesson not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            code = request.data.get('code', '')
            print(f"[DEBUG] Code received (length: {len(code)}): {repr(code[:100])}")
            
            if not code:
                print(f"[DEBUG] Code is empty")
                return Response(
                    {"success": False, "message": "Code is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Execute Python code safely
            print(f"[DEBUG] About to execute Python code safely")
            try:
                execution_result = self.execute_code_with_piston(code, 'python')
                print(f"[DEBUG] Python execution successful: {type(execution_result)}")
            except Exception as e:
                print(f"[DEBUG] Python execution failed: {str(e)}")
                print(f"[DEBUG] Exception type: {type(e)}")
                return Response(
                    {"success": False, "message": str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Extract output from execution result
            actual_output = ""
            print(f"[DEBUG] Execution result keys: {list(execution_result.keys()) if execution_result else 'None'}")
            if execution_result.get('run'):
                actual_output = execution_result['run'].get('output') or execution_result['run'].get('stdout') or ""
                print(f"[DEBUG] Actual output: {repr(actual_output[:100])}")
            
            # Check if code contains all solution keywords
            missing_keywords = []
            print(f"[DEBUG] Solution keywords: {lesson.solution_keywords}")
            if lesson.solution_keywords:
                for keyword in lesson.solution_keywords:
                    if keyword not in code:
                        missing_keywords.append(keyword)
                        print(f"[DEBUG] Missing keyword: {keyword}")

            # Compare actual output with expected output (flexible matching)
            output_match = True
            print(f"[DEBUG] Expected output: {repr(lesson.expected_output[:100]) if lesson.expected_output else 'None'}")
            if lesson.expected_output:
                # Flexible matching for expected_output
                normalized_actual = actual_output.strip()
                normalized_expected = lesson.expected_output.strip()
                
                # Split expected output into parts and check if each part is contained in actual output
                expected_parts = [part.strip() for part in normalized_expected.split(',') if part.strip()]
                output_match = True
                
                for expected_part in expected_parts:
                    # Check if this expected part is contained in the actual output
                    if expected_part not in normalized_actual:
                        output_match = False
                        print(f"[DEBUG] Missing expected part: {repr(expected_part)}")
                        break
                
                print(f"[DEBUG] Flexible output comparison - Actual: {repr(normalized_actual)}, Expected parts: {expected_parts}, Match: {output_match}")

            # Determine overall success
            success = len(missing_keywords) == 0 and output_match
            print(f"[DEBUG] Final success determination: {success}")
            
            # Build appropriate message
            if not success:
                message_parts = []
                if missing_keywords:
                    message_parts.append(f"Missing keywords: {', '.join(missing_keywords)}")
                if not output_match and lesson.expected_output:
                    message_parts.append("Output does not match expected result")
                message = "Validation failed: " + "; ".join(message_parts)
            else:
                message = "Validation successful! Your Python code runs perfectly."
            
            print(f"[DEBUG] Final message: {message}")
            
            # Return comprehensive response
            response_data = {
                "success": success,
                "message": message,
                "execution_result": {
                    "language": "python",
                    "output": actual_output,
                    "expected_output": lesson.expected_output,
                    "missing_keywords": missing_keywords,
                    "output_match": output_match
                }
            }
            
            print(f"[DEBUG] About to return response: {response_data}")
            return Response(response_data)
            
        except Exception as e:
            # Log the full traceback for debugging
            error_traceback = traceback.format_exc()
            print(f"[DEBUG] EXCEPTION OCCURRED: {str(e)}")
            print(f"[DEBUG] Exception type: {type(e)}")
            print(f"[DEBUG] Full traceback:\n{error_traceback}")
            self.logger.error(f"Unexpected error in LessonValidationView for lesson {id}: {str(e)}")
            self.logger.error(f"Full traceback:\n{error_traceback}")
            
            # Return a generic error response to the client
            return Response(
                {"success": False, "message": "An unexpected error occurred. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RegisterView(generics.CreateAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer


class LoginView(TokenObtainPairView):
    permission_classes = (permissions.AllowAny,)


class CourseListView(generics.ListAPIView):
    serializer_class = CourseSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        qs = Course.objects.all().select_related("author")
        if self.request.user.is_authenticated and getattr(self.request.user, "role", None) in {"admin", "instructor"}:
            return qs.order_by("-updated_at", "-id")
        return qs.filter(is_published=True).order_by("-published_at", "-updated_at", "-id")


class CourseDetailView(generics.RetrieveAPIView):
    serializer_class = CourseSerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = "slug"

    def get_queryset(self):
        qs = Course.objects.all().select_related("author")
        if self.request.user.is_authenticated and getattr(self.request.user, "role", None) in {"admin", "instructor"}:
            return qs
        return qs.filter(is_published=True)


class LessonListView(generics.ListAPIView):
    serializer_class = LessonSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        qs = Lesson.objects.all().select_related("course")

        course_slug = self.request.query_params.get("course")
        if course_slug:
            qs = qs.filter(course__slug=course_slug)

        if self.request.user.is_authenticated and getattr(self.request.user, "role", None) in {"admin", "instructor"}:
            return qs.order_by("course_id", "order", "id")
        return qs.filter(is_published=True, course__is_published=True).order_by("course_id", "order", "id")


class LessonDetailView(generics.RetrieveAPIView):
    serializer_class = LessonSerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = "id"

    def get_queryset(self):
        qs = Lesson.objects.all().select_related("course")
        if self.request.user.is_authenticated and getattr(self.request.user, "role", None) in {"admin", "instructor"}:
            return qs
        return qs.filter(is_published=True, course__is_published=True)


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


class ProgressListView(generics.ListAPIView):
    serializer_class = ProgressSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        qs = Progress.objects.filter(user=self.request.user).select_related("lesson", "lesson__course")
        course_slug = self.request.query_params.get("course")
        if course_slug:
            qs = qs.filter(lesson__course__slug=course_slug)
        return qs.order_by("-updated_at", "-id")


class ProgressUpsertView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = ProgressUpsertSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lesson = serializer.validated_data["lesson"]

        progress, _created = Progress.objects.select_for_update().get_or_create(
            user=request.user, lesson=lesson
        )
        for field, value in serializer.validated_data.items():
            setattr(progress, field, value)
        progress.save()
        return Response(ProgressSerializer(progress).data, status=status.HTTP_200_OK)
