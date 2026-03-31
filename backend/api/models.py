from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    class Role(models.TextChoices):
        LEARNER = "learner", "Learner"
        INSTRUCTOR = "instructor", "Instructor"
        ADMIN = "admin", "Admin"

    role = models.CharField(max_length=32, choices=Role.choices, default=Role.LEARNER)
    display_name = models.CharField(max_length=80, blank=True)
    bio = models.TextField(blank=True)
    avatar_url = models.URLField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.username


class Course(models.Model):
    class Level(models.TextChoices):
        BEGINNER = "beginner", "Beginner"
        INTERMEDIATE = "intermediate", "Intermediate"
        ADVANCED = "advanced", "Advanced"

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    description = models.TextField(blank=True)
    level = models.CharField(max_length=32, choices=Level.choices, default=Level.BEGINNER)
    language = models.CharField(max_length=64, blank=True)
    thumbnail_url = models.URLField(blank=True)
    estimated_minutes = models.PositiveIntegerField(null=True, blank=True)

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="courses_authored",
    )

    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["is_published", "published_at"]),
        ]

    def __str__(self) -> str:
        return self.title


class Lesson(models.Model):
    class Difficulty(models.TextChoices):
        EASY = "easy", "Easy"
        MEDIUM = "medium", "Medium"
        HARD = "hard", "Hard"

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="lessons")
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220)
    order = models.PositiveIntegerField()

    summary = models.TextField(blank=True)
    content = models.TextField(blank=True)
    video_url = models.URLField(blank=True)
    difficulty = models.CharField(max_length=16, choices=Difficulty.choices, default=Difficulty.EASY)
    estimated_minutes = models.PositiveIntegerField(null=True, blank=True)

    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["course", "slug"], name="uniq_lesson_slug_per_course"),
            models.UniqueConstraint(fields=["course", "order"], name="uniq_lesson_order_per_course"),
        ]
        indexes = [
            models.Index(fields=["course", "order"]),
            models.Index(fields=["course", "slug"]),
            models.Index(fields=["is_published", "published_at"]),
        ]
        ordering = ["course_id", "order", "id"]

    def __str__(self) -> str:
        return f"{self.course.title} · {self.title}"


class Progress(models.Model):
    class Status(models.TextChoices):
        NOT_STARTED = "not_started", "Not started"
        IN_PROGRESS = "in_progress", "In progress"
        COMPLETED = "completed", "Completed"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="progress")
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="progress")

    status = models.CharField(max_length=16, choices=Status.choices, default=Status.NOT_STARTED)
    progress_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    started_at = models.DateTimeField(null=True, blank=True)
    last_accessed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "lesson"], name="uniq_progress_per_user_lesson"),
        ]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["lesson", "user"]),
        ]

    def mark_accessed(self) -> None:
        now = timezone.now()
        if self.started_at is None and self.status != self.Status.COMPLETED:
            self.started_at = now
            self.status = self.Status.IN_PROGRESS
        self.last_accessed_at = now

    def mark_completed(self) -> None:
        now = timezone.now()
        self.status = self.Status.COMPLETED
        self.progress_percent = 100
        self.completed_at = now
        if self.started_at is None:
            self.started_at = now
        self.last_accessed_at = now

    def __str__(self) -> str:
        return f"{self.user_id}:{self.lesson_id} {self.status}"
