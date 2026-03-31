from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

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
