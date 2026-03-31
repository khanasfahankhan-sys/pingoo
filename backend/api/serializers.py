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
            "estimated_minutes",
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
