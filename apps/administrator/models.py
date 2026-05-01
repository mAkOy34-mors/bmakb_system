# apps/administrator/models.py
# Replace your existing models.py with this complete file.

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class Administrator(AbstractUser):

    phone = models.CharField(max_length=20, blank=True)
    profile_picture = models.ImageField(
        upload_to='admin_pics/',
        blank=True,
        null=True,
    )

    class Meta:
        db_table = 'administrator'
        verbose_name = 'Administrator'
        verbose_name_plural = 'Administrators'

    def __str__(self):
        return f"{self.get_full_name() or self.username}"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username


# ── Admin Activity Log ────────────────────────────────────────────────────────

class AdminLog(models.Model):

    ACTION_CHOICES = [
        # Member actions
        ('member_add',    'Member Added'),
        ('member_edit',   'Member Edited'),
        ('member_delete', 'Member Deleted'),
        ('member_view',   'Member Viewed'),
        # Auth actions
        ('login',         'Admin Login'),
        ('logout',        'Admin Logout'),
        # System
        ('export',        'Data Exported'),
        ('other',         'Other'),
    ]

    SEVERITY_CHOICES = [
        ('info',    'Info'),
        ('warning', 'Warning'),
        ('danger',  'Danger'),
    ]

    admin = models.ForeignKey(
        Administrator,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='activity_logs',
    )
    action      = models.CharField(max_length=30, choices=ACTION_CHOICES)
    severity    = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='info')
    target_name = models.CharField(max_length=200, blank=True,
                                   help_text='Human-readable target, e.g. member name')
    target_id   = models.CharField(max_length=50, blank=True,
                                   help_text='Account number or PK of the affected object')
    description = models.TextField(blank=True)
    ip_address  = models.GenericIPAddressField(null=True, blank=True)
    timestamp   = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering     = ['-timestamp']
        verbose_name = 'Admin Log'
        verbose_name_plural = 'Admin Logs'

    def __str__(self):
        name = self.admin.get_full_name() if self.admin else 'Unknown'
        return f"[{self.severity.upper()}] {name} — {self.get_action_display()} @ {self.timestamp:%Y-%m-%d %H:%M}"