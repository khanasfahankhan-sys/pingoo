from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Course, Lesson, Progress, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (
        (
            "Pingoo profile",
            {"fields": ("role", "display_name", "bio", "avatar_url")},
        ),
    )
    list_display = ("username", "email", "role", "is_staff", "is_active", "date_joined")
    list_filter = ("role", "is_staff", "is_superuser", "is_active")
    search_fields = ("username", "email", "display_name")


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0
    fields = ("order", "title", "slug", "is_published", "published_at", "updated_at")
    readonly_fields = ("updated_at",)
    ordering = ("order", "id")
    show_change_link = True


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "author", "level", "is_published", "published_at", "updated_at")
    list_filter = ("level", "is_published", "language")
    search_fields = ("title", "slug", "description", "author__username", "author__email")
    autocomplete_fields = ("author",)
    prepopulated_fields = {"slug": ("title",)}
    inlines = (LessonInline,)
    ordering = ("-updated_at", "-id")


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "order", "slug", "difficulty", "is_published", "published_at", "updated_at")
    list_filter = ("difficulty", "is_published", "course")
    search_fields = ("title", "slug", "summary", "course__title", "course__slug")
    autocomplete_fields = ("course",)
    prepopulated_fields = {"slug": ("title",)}
    ordering = ("course_id", "order", "id")


@admin.register(Progress)
class ProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "lesson", "status", "progress_percent", "last_accessed_at", "updated_at")
    list_filter = ("status",)
    search_fields = ("user__username", "user__email", "lesson__title", "lesson__course__title")
    autocomplete_fields = ("user", "lesson")
    ordering = ("-updated_at", "-id")
