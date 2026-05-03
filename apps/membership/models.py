# apps/membership/models.py

from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from django.conf import settings


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

    DEACTIVATION_REASONS = [
        ('non_payment', 'Non-payment of dues/subscription'),
        ('voluntary_withdrawal', 'Voluntary withdrawal'),
        ('expired_term', 'Membership term expired'),
        ('violation', 'Violation of cooperative policies'),
        ('death', 'Death of member'),
        ('inactivity', 'Prolonged inactivity'),
        ('other', 'Other'),
    ]

    # ── Identification ────────────────────────────────────────────────────────
    account_number = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        blank=True,
    )
    tin = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='TIN',
    )

    # ── Personal Info ─────────────────────────────────────────────────────────
    name = models.CharField(max_length=150)
    date_of_birth = models.DateField()
    age = models.PositiveIntegerField(editable=False)
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
        help_text='Capital Build-Up. Admin can set this directly, and initial_paid_up adds on top.',
    )
    initial_paid_up = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)],
        verbose_name='Initial Paid-Up',
        help_text='Amount to add on top of the CBU value submitted in the form.',
    )

    savings = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)],
        help_text='Member savings amount.',
    )

    # ── Timestamps ────────────────────────────────────────────────────────────
    date_joined = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    deactivation_date = models.DateTimeField(null=True, blank=True)
    deactivation_reason = models.CharField(
        max_length=50,
        choices=DEACTIVATION_REASONS,
        null=True,
        blank=True,
    )
    deactivation_reason_other = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text='Custom reason when "Other" is selected',
    )
    deactivation_resolution = models.TextField(
        null=True,
        blank=True,
        help_text='Action plan or requirements needed for reactivation',
    )
    reactivation_date = models.DateTimeField(null=True, blank=True)
    reactivation_notes = models.TextField(
        null=True,
        blank=True,
        help_text='Notes about the reactivation process',
    )

    deactivated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deactivated_members',
    )
    reactivated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reactivated_members',
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Member'
        verbose_name_plural = 'Members'

    def __str__(self):
        return f"{self.account_number} - {self.name}"

    # ── NEW: Helper Methods ───────────────────────────────────────────────────
    def deactivate(self, reason, resolution=None, deactivated_by=None, reason_other=None):
        """Deactivate a member with reason and resolution"""
        from django.utils import timezone
        self.is_active = False
        self.deactivation_date = timezone.now()
        self.deactivation_reason = reason
        if reason == 'other' and reason_other:
            self.deactivation_reason_other = reason_other
        self.deactivation_resolution = resolution
        if deactivated_by:
            self.deactivated_by = deactivated_by
        self.save()

    def reactivate(self, notes=None, reactivated_by=None):
        """Reactivate a member with notes"""
        from django.utils import timezone
        self.is_active = True
        self.reactivation_date = timezone.now()
        self.reactivation_notes = notes
        if reactivated_by:
            self.reactivated_by = reactivated_by
        self.save()

    @property
    def get_deactivation_reason_display_full(self):
        """Get full deactivation reason display (includes 'other' text if applicable)"""
        if self.deactivation_reason == 'other' and self.deactivation_reason_other:
            return self.deactivation_reason_other
        return self.get_deactivation_reason_display()

    def save(self, *args, **kwargs):
        # Auto-generate account number on first save
        if not self.pk:
            last = Member.objects.order_by('id').last()
            next_num = (last.id + 1) if last else 1
            self.account_number = f"BMAKB-{next_num:05d}"

        # Auto-compute age from date_of_birth before saving
        if self.date_of_birth:
            from django.utils import timezone
            today = timezone.now().date()
            dob = self.date_of_birth
            age = today.year - dob.year
            if (today.month, today.day) < (dob.month, dob.day):
                age -= 1
            self.age = age

        super().save(*args, **kwargs)

# apps/membership/models.py

class MemberTransaction(models.Model):

    TRANSACTION_TYPES = [
        ('initial_paid_up', 'Initial Paid-Up'),
        ('cbu',             'CBU Deposit'),
        ('savings',         'Savings Deposit'),
        ('subscription',    'Subscription Payment'),
    ]

    member      = models.ForeignKey(Member, on_delete=models.PROTECT, related_name='transactions')
    type        = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount      = models.DecimalField(max_digits=12, decimal_places=2)
    note        = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # changed from 'auth.User'
        on_delete=models.SET_NULL,
        null=True,
        editable=False
    )
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.member.account_number} | {self.type} | ₱{self.amount}"