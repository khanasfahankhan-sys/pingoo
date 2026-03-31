from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CourseDetailView,
    CourseListView,
    LessonDetailView,
    LessonListView,
    LoginView,
    MeView,
    ProgressListView,
    ProgressUpsertView,
    RegisterView,
)

urlpatterns = [
    # Auth
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("auth/me/", MeView.as_view(), name="auth-me"),

    # Courses
    path("courses/", CourseListView.as_view(), name="course-list"),
    path("courses/<slug:slug>/", CourseDetailView.as_view(), name="course-detail"),

    # Lessons
    path("lessons/", LessonListView.as_view(), name="lesson-list"),
    path("lessons/<int:id>/", LessonDetailView.as_view(), name="lesson-detail"),

    # Progress
    path("progress/", ProgressListView.as_view(), name="progress-list"),
    path("progress/upsert/", ProgressUpsertView.as_view(), name="progress-upsert"),
]
