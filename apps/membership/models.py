# apps/membership/models.py

from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator


class Member(models.Model):

    MEMBERSHIP_CHOICES = [
        ('regular', 'Regular'),
        ('associate', 'Associate'),
    ]

    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]

    # ── Identification ────────────────────────────────────────────────────────
    account_number = models.CharField(
        max_length=20,
        unique=True,
        editable=False,  # auto-generated
    )
    tin = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='TIN',
    )

    # ── Personal Info ─────────────────────────────────────────────────────────
    name = models.CharField(max_length=150)
    date_of_birth = models.DateField()
    age = models.PositiveIntegerField(editable=False)  # auto-computed
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    occupation = models.CharField(max_length=100)
    address = models.TextField()

    # ── Membership ────────────────────────────────────────────────────────────
    type_of_membership = models.CharField(
        max_length=10,
        choices=MEMBERSHIP_CHOICES,
        default='regular',
    )

    # ── Subscription & Capital ────────────────────────────────────────────────
    subscription = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)],
    )
    con = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        verbose_name='CON',
        validators=[MinValueValidator(0)],
    )
    initial_subscription = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)],
    )
    initial_paid_up = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)],
    )

    # ── Timestamps ────────────────────────────────────────────────────────────
    date_joined = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Member'
        verbose_name_plural = 'Members'

    def __str__(self):
        return f"{self.account_number} - {self.name}"

    def save(self, *args, **kwargs):
        # Auto-compute age from date_of_birth
        if self.date_of_birth:
            today = timezone.now().date()
            self.age = (
                today.year - self.date_of_birth.year
                - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
            )
        # Auto-generate account number
        if not self.account_number:
            last = Member.objects.order_by('id').last()
            next_id = (last.id + 1) if last else 1
            self.account_number = f"BMAKB-{next_id:05d}"
        super().save(*args, **kwargs)