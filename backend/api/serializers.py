from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Course, Lesson, Progress

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "role",
            "display_name",
            "bio",
            "avatar_url",
            "first_name",
            "last_name",
            "is_active",
            "date_joined",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "is_active", "date_joined", "created_at", "updated_at")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "password",
            "display_name",
            "first_name",
            "last_name",
        )
        read_only_fields = ("id",)

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = (
            "id",
            "title",
            "slug",
            "description",
            "level",
            "language",
            "thumbnail_url",
            "estimated_minutes",
            "author",
            "is_published",
            "published_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = (
            "id",
            "course",
            "title",
            "slug",
            "order",
            "summary",
            "content",
            "video_url",
            "difficulty",
            "language",
            "estimated_minutes",
            "expected_output",
            "solution_keywords",
            "is_published",
            "published_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class ProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Progress
        fields = (
            "id",
            "user",
            "lesson",
            "status",
            "progress_percent",
            "started_at",
            "last_accessed_at",
            "completed_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class ProgressUpsertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Progress
        fields = (
            "lesson",
            "status",
            "progress_percent",
            "started_at",
            "last_accessed_at",
            "completed_at",
        )
