# apps/administrator/views.py

from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q, Count, Sum
from django.db.models.functions import TruncMonth, TruncWeek, TruncDay
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from collections import defaultdict
import json

from .forms import AdminRegisterForm, AdminLoginForm
from .models import AdminLog
from .log_utils import log_action, get_client_ip
from apps.membership.models import Member, MemberTransaction

from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string
import random

User = get_user_model()

# ── Register ──────────────────────────────────────────────────────────────────
def admin_register(request):
    if request.user.is_authenticated:
        return redirect('administrator:dashboard')

    if request.method == 'POST':
        form = AdminRegisterForm(request.POST, request.FILES)
        if form.is_valid():
            admin = form.save()
            login(request, admin)
            messages.success(
                request,
                f'Welcome, {admin.get_full_name()}! Your account has been created.'
            )
            return redirect('administrator:dashboard')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = AdminRegisterForm()

    return render(request, 'administrator/register.html', {'form': form})


# ── Login ─────────────────────────────────────────────────────────────────────
def admin_login(request):
    if request.user.is_authenticated:
        return redirect('administrator:dashboard')

    if request.method == 'POST':
        form = AdminLoginForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            AdminLog.objects.create(
                admin=user,
                action='login',
                severity='info',
                description='Administrator logged in.',
                ip_address=get_client_ip(request),
            )
            messages.success(request, f'Welcome back, {user.get_full_name()}!')
            return redirect(request.GET.get('next', 'administrator:dashboard'))
        else:
            messages.error(request, 'Invalid username or password.')
    else:
        form = AdminLoginForm()

    return render(request, 'administrator/login.html', {'form': form})


# ── Logout ────────────────────────────────────────────────────────────────────
@login_required
def admin_logout(request):
    AdminLog.objects.create(
        admin=request.user,
        action='logout',
        severity='info',
        description='Administrator logged out.',
        ip_address=get_client_ip(request),
    )
    logout(request)
    messages.success(request, 'You have been logged out successfully.')
    return redirect('administrator:login')


# ── Dashboard ─────────────────────────────────────────────────────────────────
# ── Dashboard ─────────────────────────────────────────────────────────────────
@login_required
def dashboard(request):
    monthly_qs = (
        Member.objects
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )
    monthly_labels = [e['month'].strftime('%b %Y') for e in monthly_qs]
    monthly_data   = [e['count'] for e in monthly_qs]

    regular_count   = Member.objects.filter(type_of_membership='regular').count()
    associate_count = Member.objects.filter(type_of_membership='associate').count()

    revenue_qs = (
        Member.objects
        .annotate(month=TruncMonth('date_joined'))
        .values('month')
        .annotate(total=Sum('subscription'))
        .order_by('month')
    )
    revenue_labels = [e['month'].strftime('%b %Y') for e in revenue_qs]
    revenue_data   = [float(e['total'] or 0) for e in revenue_qs]

    total_cbu             = Member.objects.aggregate(t=Sum('con'))['t'] or 0
    total_savings         = Member.objects.aggregate(t=Sum('savings'))['t'] or 0
    total_subscription    = Member.objects.aggregate(t=Sum('subscription'))['t'] or 0
    total_initial_paid_up = Member.objects.aggregate(t=Sum('initial_paid_up'))['t'] or 0

    # ── Serialize all members for the dashboard modal ─────────────────────────
    all_members = Member.objects.order_by('-created_at').values(
        'id', 'account_number', 'name',
        'type_of_membership', 'date_joined', 'is_active',
    )
    members_json = [
        {
            'account_number':     m['account_number'],
            'name':               m['name'],
            'type_of_membership': m['type_of_membership'],
            'date_joined':        m['date_joined'].strftime('%b %d, %Y'),
            'is_active':          m['is_active'],
            'detail_url':         reverse('membership:member_detail', args=[m['id']]),
        }
        for m in all_members
    ]

    context = {
        # ── Member counts ─────────────────────────────────────────────────
        'total_members':     Member.objects.count(),
        'active_members':    Member.objects.filter(is_active=True).count(),
        'inactive_members':  Member.objects.filter(is_active=False).count(),
        'regular_members':   regular_count,
        'associate_members': associate_count,
        'recent_members':    Member.objects.order_by('-created_at')[:5],

        # ── Modal data ────────────────────────────────────────────────────
        'members_json':      members_json,   # ← NEW

        # ── Financial totals ──────────────────────────────────────────────
        'total_cbu':             total_cbu,
        'total_savings':         total_savings,
        'total_subscription':    total_subscription,
        'total_initial_paid_up': total_initial_paid_up,

        # ── Chart data ────────────────────────────────────────────────────
        'monthly_labels':  json.dumps(monthly_labels),
        'monthly_data':    json.dumps(monthly_data),
        'type_labels':     json.dumps(['Regular', 'Associate']),
        'type_values':     json.dumps([regular_count, associate_count]),
        'revenue_labels':  json.dumps(revenue_labels),
        'revenue_data':    json.dumps(revenue_data),
        'total_revenue':   f'{sum(revenue_data):,.2f}',
        'revenue_periods': len(revenue_data),
    }

    return render(request, 'administrator/dashboard.html', context)

# ── Analytics ─────────────────────────────────────────────────────────────────
@login_required
def analytics(request):
    # ── Membership trend (monthly / daily / weekly) ───────────────────────
    monthly_qs = (
        Member.objects
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )
    monthly_labels = [entry['month'].strftime('%b %Y') for entry in monthly_qs]
    monthly_data   = [entry['count'] for entry in monthly_qs]

    daily_qs = (
        Member.objects
        .annotate(day=TruncDay('created_at'))
        .values('day')
        .annotate(count=Count('id'))
        .order_by('day')
    )
    daily_labels = [entry['day'].strftime('%b %d') for entry in daily_qs]
    daily_data   = [entry['count'] for entry in daily_qs]

    weekly_qs = (
        Member.objects
        .annotate(week=TruncWeek('created_at'))
        .values('week')
        .annotate(count=Count('id'))
        .order_by('week')
    )
    weekly_labels = [entry['week'].strftime('%b %d') for entry in weekly_qs]
    weekly_data   = [entry['count'] for entry in weekly_qs]

    # ── Membership types ──────────────────────────────────────────────────
    regular_count   = Member.objects.filter(type_of_membership='regular').count()
    associate_count = Member.objects.filter(type_of_membership='associate').count()

    # ── Revenue ───────────────────────────────────────────────────────────
    revenue_qs = (
        Member.objects
        .annotate(month=TruncMonth('date_joined'))
        .values('month')
        .annotate(total=Sum('subscription'))
        .order_by('month')
    )
    revenue_labels = [entry['month'].strftime('%b %Y') for entry in revenue_qs]
    revenue_data   = [float(entry['total'] or 0) for entry in revenue_qs]
    total_revenue  = sum(revenue_data)

    # ── Gender counts ─────────────────────────────────────────────────────
    total_members  = Member.objects.count()
    male_count     = Member.objects.filter(gender='male').count()
    female_count   = Member.objects.filter(gender='female').count()
    other_count    = Member.objects.filter(gender='other').count()

    male_percent   = round(male_count   / total_members * 100, 1) if total_members else 0
    female_percent = round(female_count / total_members * 100, 1) if total_members else 0
    other_percent  = round(other_count  / total_members * 100, 1) if total_members else 0

    # ── Barangay breakdown ────────────────────────────────────────────────
    barangay_map = defaultdict(lambda: {'total': 0, 'male': 0, 'female': 0})

    for m in Member.objects.values('address', 'gender'):
        raw      = (m['address'] or '').strip()
        barangay = raw.split(',')[0].strip() if raw else 'Unknown'
        barangay_map[barangay]['total'] += 1
        if m['gender'] == 'male':
            barangay_map[barangay]['male'] += 1
        elif m['gender'] == 'female':
            barangay_map[barangay]['female'] += 1

    sorted_barangays = sorted(
        barangay_map.items(),
        key=lambda x: x[1]['total'],
        reverse=True,
    )[:20]

    barangay_labels = [item[0]          for item in sorted_barangays]
    barangay_data   = [item[1]['total'] for item in sorted_barangays]
    barangay_male   = [item[1]['male']  for item in sorted_barangays]
    barangay_female = [item[1]['female']for item in sorted_barangays]

    # ── CBU trend ─────────────────────────────────────────────────────────
    cbu_qs = (
        Member.objects
        .annotate(month=TruncMonth('date_joined'))
        .values('month')
        .annotate(total=Sum('con'))
        .order_by('month')
    )
    cbu_labels = [entry['month'].strftime('%b %Y') for entry in cbu_qs]
    cbu_data   = [float(entry['total'] or 0) for entry in cbu_qs]

    # ── Subscription trend (direct from Member) ───────────────────────────
    sub_qs = (
        Member.objects
        .filter(subscription__gt=0)
        .annotate(month=TruncMonth('date_joined'))
        .values('month')
        .annotate(total=Sum('subscription'))
        .order_by('month')
    )
    subscription_labels = [entry['month'].strftime('%b %Y') for entry in sub_qs]
    subscription_data   = [float(entry['total'] or 0) for entry in sub_qs]

    # ── Initial Paid-Up trend (direct from Member) ────────────────────────
    ip_qs = (
        Member.objects
        .filter(initial_paid_up__gt=0)
        .annotate(month=TruncMonth('date_joined'))
        .values('month')
        .annotate(total=Sum('initial_paid_up'))
        .order_by('month')
    )
    initial_paid_up_labels = [entry['month'].strftime('%b %Y') for entry in ip_qs]
    initial_paid_up_data   = [float(entry['total'] or 0) for entry in ip_qs]

    # ── Savings trend (direct from Member) ───────────────────────────────
    sav_qs = (
        Member.objects
        .filter(savings__gt=0)
        .annotate(month=TruncMonth('date_joined'))
        .values('month')
        .annotate(total=Sum('savings'))
        .order_by('month')
    )
    savings_labels = [entry['month'].strftime('%b %Y') for entry in sav_qs]
    savings_data   = [float(entry['total'] or 0) for entry in sav_qs]

    # ── Financial totals ──────────────────────────────────────────────────
    total_cbu             = Member.objects.aggregate(t=Sum('con'))['t'] or 0
    total_savings         = Member.objects.aggregate(t=Sum('savings'))['t'] or 0
    total_subscription    = sum(subscription_data)
    total_initial_paid_up = sum(initial_paid_up_data)

    # ── Active vs Inactive trend ──────────────────────────────────────────────
    active_qs = (
        Member.objects
        .filter(is_active=True)
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )

    inactive_qs = (
        Member.objects
        .filter(is_active=False)
        .annotate(month=TruncMonth('deactivation_date'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )

    # Merge both into a unified set of months
    all_months = sorted(set(
        [e['month'] for e in active_qs if e['month']] +
        [e['month'] for e in inactive_qs if e['month']]
    ))

    active_map = {e['month']: e['count'] for e in active_qs if e['month']}
    inactive_map = {e['month']: e['count'] for e in inactive_qs if e['month']}

    status_labels = [m.strftime('%b %Y') for m in all_months]
    status_active_data = [active_map.get(m, 0) for m in all_months]
    status_inactive_data = [inactive_map.get(m, 0) for m in all_months]

    context = {
        # ── Stat cards ────────────────────────────────────────────────────
        'total_members':     total_members,
        'active_members':    Member.objects.filter(is_active=True).count(),
        'regular_members':   regular_count,
        'associate_members': associate_count,

        # ── Gender stat cards ─────────────────────────────────────────────
        'male_members':   male_count,
        'female_members': female_count,
        'other_members':  other_count,
        'male_percent':   male_percent,
        'female_percent': female_percent,
        'other_percent':  other_percent,

        # ── Membership trend chart ────────────────────────────────────────
        'monthly_labels':     json.dumps(monthly_labels),
        'monthly_data':       json.dumps(monthly_data),
        'daily_labels':       json.dumps(daily_labels),
        'daily_data':         json.dumps(daily_data),
        'weekly_labels':      json.dumps(weekly_labels),
        'weekly_data':        json.dumps(weekly_data),
        'chart_months_count': len(monthly_labels),

        # ── Membership type donut ─────────────────────────────────────────
        'type_labels': json.dumps(['Regular', 'Associate']),
        'type_values': json.dumps([regular_count, associate_count]),

        # ── Revenue bar ───────────────────────────────────────────────────
        'revenue_labels':  json.dumps(revenue_labels),
        'revenue_data':    json.dumps(revenue_data),
        'total_revenue':   f'{total_revenue:,.2f}',
        'revenue_periods': len(revenue_data),

        # ── Barangay chart ────────────────────────────────────────────────
        'barangay_labels':  json.dumps(barangay_labels),
        'barangay_data':    json.dumps(barangay_data),
        'barangay_male':    json.dumps(barangay_male),
        'barangay_female':  json.dumps(barangay_female),
        'barangay_count':   len(barangay_labels),

        # ── CBU trend chart ───────────────────────────────────────────────
        'cbu_labels': json.dumps(cbu_labels),
        'cbu_data':   json.dumps(cbu_data),
        'total_cbu':  total_cbu,

        # ── Financial totals ──────────────────────────────────────────────
        'total_savings':         total_savings,
        'total_subscription':    f'{total_subscription:,.2f}',
        'total_initial_paid_up': f'{total_initial_paid_up:,.2f}',

        # ── Subscription trend chart ──────────────────────────────────────
        'subscription_labels': json.dumps(subscription_labels),
        'subscription_data':   json.dumps(subscription_data),

        # ── Initial Paid-Up trend chart ───────────────────────────────────
        'initial_paid_up_labels': json.dumps(initial_paid_up_labels),
        'initial_paid_up_data':   json.dumps(initial_paid_up_data),

        # ── Savings trend chart ───────────────────────────────────────────
        'savings_labels': json.dumps(savings_labels),
        'savings_data':   json.dumps(savings_data),

        'status_labels': json.dumps(status_labels),
        'status_active_data': json.dumps(status_active_data),
        'status_inactive_data': json.dumps(status_inactive_data),
        'total_active': Member.objects.filter(is_active=True).count(),
        'total_inactive': Member.objects.filter(is_active=False).count(),
    }

    return render(request, 'administrator/analytics.html', context)

# ── Admin Logs ────────────────────────────────────────────────────────────────
@login_required
def admin_logs(request):
    qs = AdminLog.objects.select_related('admin').all()

    q = request.GET.get('q', '').strip()
    if q:
        qs = qs.filter(
            Q(target_name__icontains=q) |
            Q(target_id__icontains=q)   |
            Q(description__icontains=q) |
            Q(admin__first_name__icontains=q) |
            Q(admin__last_name__icontains=q)  |
            Q(admin__username__icontains=q)
        )

    action_filter = request.GET.get('action', '').strip()
    if action_filter:
        qs = qs.filter(action=action_filter)

    severity_filter = request.GET.get('severity', '').strip()
    if severity_filter:
        qs = qs.filter(severity=severity_filter)

    date_range = request.GET.get('date_range', '').strip()
    now = timezone.now()
    if date_range == 'today':
        qs = qs.filter(timestamp__date=now.date())
    elif date_range == '7d':
        qs = qs.filter(timestamp__gte=now - timedelta(days=7))
    elif date_range == '30d':
        qs = qs.filter(timestamp__gte=now - timedelta(days=30))

    paginator = Paginator(qs, 25)
    page_obj  = paginator.get_page(request.GET.get('page', 1))

    total_logs   = AdminLog.objects.count()
    today_logs   = AdminLog.objects.filter(timestamp__date=now.date()).count()
    warning_logs = AdminLog.objects.filter(severity='warning').count()
    danger_logs  = AdminLog.objects.filter(severity='danger').count()

    context = {
        'page_obj':          page_obj,
        'action_choices':    AdminLog.ACTION_CHOICES,
        'severity_choices':  AdminLog.SEVERITY_CHOICES,
        'q':                 q,
        'action_filter':     action_filter,
        'severity_filter':   severity_filter,
        'date_range':        date_range,
        'total_logs':        total_logs,
        'today_logs':        today_logs,
        'warning_logs':      warning_logs,
        'danger_logs':       danger_logs,
    }
    return render(request, 'administrator/admin_logs.html', context)


def _generate_otp():
    """Return a random 6-digit OTP string."""
    return str(random.randint(100000, 999999))


# ── Step 1 – Enter email ──────────────────────────────────────────────────────
def forgot_password(request):
    """Ask the user for their registered email address."""
    if request.user.is_authenticated:
        return redirect('administrator:dashboard')

    if request.method == 'POST':
        email = request.POST.get('email', '').strip().lower()

        # Always show a generic success message (prevents email enumeration)
        user = User.objects.filter(email__iexact=email).first()
        if user:
            otp = _generate_otp()
            # Store OTP + email in session (expires with session)
            request.session['otp_code'] = otp
            request.session['otp_email'] = email
            request.session['otp_verified'] = False

            subject = 'BMAKB - Password Reset OTP'
            text_body = (
                f'Hello {user.get_full_name()},\n\n'
                f'Your OTP is: {otp}\n\n'
                f'This code is valid for the duration of your browser session.\n'
                f'If you did not request this, please ignore this email.\n\n'
                f'— BMAKB Membership System'
            )
            html_body = f'''
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            </head>
            <body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',DM Sans,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 0;">
                <tr>
                  <td align="center">
                    <table width="480" cellpadding="0" cellspacing="0"
                           style="background:#ffffff;border-radius:16px;overflow:hidden;
                                  box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                      <!-- Header -->
                      <tr>
                        <td align="center"
                            style="background:linear-gradient(135deg,#1a4731,#1d6a5b);
                                   padding:32px 40px;">
                          <h1 style="margin:0;font-size:28px;color:#86efac;letter-spacing:-0.5px;">
                            BMAKB
                          </h1>
                          <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.5);
                                    letter-spacing:1px;text-transform:uppercase;">
                            Membership Management System
                          </p>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td style="padding:36px 40px 24px;">

                          <!-- Icon -->
                          <div align="center" style="margin-bottom:24px;">
                            <div style="width:64px;height:64px;background:#dcfce7;border-radius:50%;
                                        display:inline-flex;align-items:center;justify-content:center;
                                        font-size:28px;line-height:64px;text-align:center;">
                              🔐
                            </div>
                          </div>

                          <h2 style="margin:0 0 8px;font-size:20px;color:#0d2b1f;text-align:center;">
                            Password Reset Request
                          </h2>
                          <p style="margin:0 0 24px;font-size:14px;color:#5a7a6a;text-align:center;">
                            Hello, <strong style="color:#0d2b1f;">{user.get_full_name()}</strong>!
                            Use the OTP below to reset your password.
                          </p>

                          <!-- OTP Box -->
                          <div align="center" style="margin:0 0 28px;">
                            <div style="display:inline-block;background:#f0fdf4;
                                        border:2px dashed #16a34a;border-radius:14px;
                                        padding:20px 48px;">
                              <p style="margin:0 0 4px;font-size:11px;font-weight:600;
                                         letter-spacing:2px;text-transform:uppercase;color:#5a7a6a;">
                                Your OTP Code
                              </p>
                              <p style="margin:0;font-size:42px;font-weight:800;
                                         letter-spacing:12px;color:#15803d;line-height:1.2;">
                                {otp}
                              </p>
                            </div>
                          </div>

                          <!-- Info -->
                          <table width="100%" cellpadding="0" cellspacing="0"
                                 style="background:#f0fdf4;border-radius:10px;
                                        border:1px solid #d1e8dc;margin-bottom:24px;">
                            <tr>
                              <td style="padding:14px 16px;font-size:13px;color:#166534;">
                                <strong>&#x23F1; Valid for:</strong> Duration of your current browser session
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:0 16px 14px;font-size:13px;color:#166534;">
                                <strong>&#x1F512; Keep it safe:</strong> Never share this code with anyone
                              </td>
                            </tr>
                          </table>

                          <!-- Warning -->
                          <table width="100%" cellpadding="0" cellspacing="0"
                                 style="background:#fef2f2;border-radius:10px;
                                        border:1px solid #fecaca;margin-bottom:8px;">
                            <tr>
                              <td style="padding:12px 16px;font-size:12px;color:#991b1b;">
                                &#x26A0;&#xFE0F; If you did not request a password reset, please ignore this email.
                                Your account is safe.
                              </td>
                            </tr>
                          </table>

                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background:#f0fdf4;border-top:1px solid #d1e8dc;
                                   padding:20px 40px;text-align:center;">
                          <p style="margin:0;font-size:12px;color:#5a7a6a;">
                            &copy; 2026 <strong style="color:#15803d;">BMAKB Membership System</strong>
                          </p>
                          <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">
                            Developed by Micho Moreno &amp; Flerie Jill Montes
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            '''

            email_msg = EmailMultiAlternatives(
                subject=subject,
                body=text_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email],
            )
            email_msg.attach_alternative(html_body, "text/html")
            email_msg.send(fail_silently=False)

        # Redirect regardless so we don't reveal whether the email exists
        messages.success(
            request,
            "If that email is registered, we've sent a 6-digit OTP to it."
        )
        return redirect('administrator:verify_otp')

    return render(request, 'administrator/forgot_password.html')

# ── Step 2 – Verify OTP ───────────────────────────────────────────────────────
def verify_otp(request):
    """Verify the 6-digit OTP the user received by email."""
    if request.user.is_authenticated:
        return redirect('administrator:dashboard')

    # Guard: must have gone through step 1
    if not request.session.get('otp_email'):
        messages.error(request, 'Please start the password reset process again.')
        return redirect('administrator:forgot_password')

    if request.method == 'POST':
        entered = request.POST.get('otp', '').strip()
        expected = request.session.get('otp_code', '')

        if entered == expected:
            request.session['otp_verified'] = True
            return redirect('administrator:reset_password')
        else:
            messages.error(request, 'Invalid OTP. Please try again.')

    return render(request, 'administrator/verify_otp.html')


# ── Step 2b – Resend OTP ──────────────────────────────────────────────────────
def resend_otp(request):
    """Generate a fresh OTP and re-send to the stored session email."""
    if request.user.is_authenticated:
        return redirect('administrator:dashboard')

    email = request.session.get('otp_email')
    if not email:
        messages.error(request, 'Session expired. Please start again.')
        return redirect('administrator:forgot_password')

    user = User.objects.filter(email__iexact=email).first()
    if user:
        otp = _generate_otp()
        request.session['otp_code'] = otp
        request.session['otp_verified'] = False

        subject = 'BMAKB - Password Reset OTP'
        text_body = (
            f'Hello {user.get_full_name()},\n\n'
            f'Your new OTP is: {otp}\n\n'
            f'This code is valid for the duration of your browser session.\n'
            f'If you did not request this, please ignore this email.\n\n'
            f'— BMAKB Membership System'
        )
        html_body = f'''
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',DM Sans,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="480" cellpadding="0" cellspacing="0"
                       style="background:#ffffff;border-radius:16px;overflow:hidden;
                              box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                  <!-- Header -->
                  <tr>
                    <td align="center"
                        style="background:linear-gradient(135deg,#1a4731,#1d6a5b);
                               padding:32px 40px;">
                      <h1 style="margin:0;font-size:28px;color:#86efac;letter-spacing:-0.5px;">
                        BMAKB
                      </h1>
                      <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.5);
                                letter-spacing:1px;text-transform:uppercase;">
                        Membership Management System
                      </p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:36px 40px 24px;">

                      <!-- Icon -->
                      <div align="center" style="margin-bottom:24px;">
                        <div style="width:64px;height:64px;background:#dcfce7;border-radius:50%;
                                    display:inline-flex;align-items:center;justify-content:center;
                                    font-size:28px;line-height:64px;text-align:center;">
                          🔄
                        </div>
                      </div>

                      <h2 style="margin:0 0 8px;font-size:20px;color:#0d2b1f;text-align:center;">
                        New OTP Requested
                      </h2>
                      <p style="margin:0 0 24px;font-size:14px;color:#5a7a6a;text-align:center;">
                        Hello, <strong style="color:#0d2b1f;">{user.get_full_name()}</strong>!
                        Here is your new OTP code.
                      </p>

                      <!-- OTP Box -->
                      <div align="center" style="margin:0 0 28px;">
                        <div style="display:inline-block;background:#f0fdf4;
                                    border:2px dashed #16a34a;border-radius:14px;
                                    padding:20px 48px;">
                          <p style="margin:0 0 4px;font-size:11px;font-weight:600;
                                     letter-spacing:2px;text-transform:uppercase;color:#5a7a6a;">
                            Your New OTP Code
                          </p>
                          <p style="margin:0;font-size:42px;font-weight:800;
                                     letter-spacing:12px;color:#15803d;line-height:1.2;">
                            {otp}
                          </p>
                        </div>
                      </div>

                      <!-- Info -->
                      <table width="100%" cellpadding="0" cellspacing="0"
                             style="background:#f0fdf4;border-radius:10px;
                                    border:1px solid #d1e8dc;margin-bottom:24px;">
                        <tr>
                          <td style="padding:14px 16px;font-size:13px;color:#166534;">
                            <strong>&#x23F1; Valid for:</strong> Duration of your current browser session
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:0 16px 14px;font-size:13px;color:#166534;">
                            <strong>&#x1F512; Keep it safe:</strong> Never share this code with anyone
                          </td>
                        </tr>
                      </table>

                      <!-- Warning -->
                      <table width="100%" cellpadding="0" cellspacing="0"
                             style="background:#fef2f2;border-radius:10px;
                                    border:1px solid #fecaca;margin-bottom:8px;">
                        <tr>
                          <td style="padding:12px 16px;font-size:12px;color:#991b1b;">
                            &#x26A0;&#xFE0F; If you did not request a password reset, please ignore this email.
                            Your account is safe.
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#f0fdf4;border-top:1px solid #d1e8dc;
                               padding:20px 40px;text-align:center;">
                      <p style="margin:0;font-size:12px;color:#5a7a6a;">
                        &copy; 2026 <strong style="color:#15803d;">BMAKB Membership System</strong>
                      </p>
                      <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">
                        Developed by Micho Moreno &amp; Flerie Jill Montes
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        '''

        email_msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email],
        )
        email_msg.attach_alternative(html_body, "text/html")
        email_msg.send(fail_silently=False)

    messages.success(request, 'A new OTP has been sent to your email.')
    return redirect('administrator:verify_otp')

# ── Step 3 – Set new password ─────────────────────────────────────────────────
def reset_password(request):
    """Allow the user to set a new password after OTP verification."""
    if request.user.is_authenticated:
        return redirect('administrator:dashboard')

    # Guard: OTP must have been verified
    if not request.session.get('otp_verified'):
        messages.error(request, 'Please verify your OTP first.')
        return redirect('administrator:forgot_password')

    if request.method == 'POST':
        pw1 = request.POST.get('password1', '')
        pw2 = request.POST.get('password2', '')

        if pw1 != pw2:
            messages.error(request, 'Passwords do not match.')
        elif len(pw1) < 8:
            messages.error(request, 'Password must be at least 8 characters.')
        else:
            email = request.session.get('otp_email')
            user = User.objects.filter(email__iexact=email).first()
            if user:
                user.set_password(pw1)
                user.save()

                # Clear session keys
                for key in ('otp_code', 'otp_email', 'otp_verified'):
                    request.session.pop(key, None)

                messages.success(
                    request,
                    'Password reset successfully. You can now log in.'
                )
                return redirect('administrator:login')
            else:
                messages.error(request, 'Account not found. Please try again.')
                return redirect('administrator:forgot_password')

    return render(request, 'administrator/reset_password.html')