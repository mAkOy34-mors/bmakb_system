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
        help_text='Annual subscription amount.',
    )
    term_years = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name='Term (Years)',
        help_text='Number of years for the subscription term.',
    )
    con = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        verbose_name='CBU',
        validators=[MinValueValidator(0)],
        help_text='Capital Build-Up — accumulated total of all paid-up contributions.',
    )
    initial_paid_up = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)],
        verbose_name='Initial Paid-Up',
        help_text='Amount to add on top of the current CBU each time this is updated.',
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

        # Accumulate initial_paid_up into con (CBU).
        # Always: new CBU = old saved CBU + initial_paid_up entered this save.
        if self.pk:
            try:
                old = Member.objects.get(pk=self.pk)
                # Use the DB's con as the base — not whatever came from the form —
                # so the form's read-only CBU display never causes double-counting.
                self.con = (old.con or 0) + (self.initial_paid_up or 0)
            except Member.DoesNotExist:
                self.con = self.initial_paid_up or 0
        else:
            # New record: initial_paid_up seeds con directly
            self.con = self.initial_paid_up or 0

        # Auto-generate account number
        if not self.account_number:
            last = Member.objects.order_by('id').last()
            next_id = (last.id + 1) if last else 1
            self.account_number = f"BMAKB-{next_id:05d}"

        super().save(*args, **kwargs)