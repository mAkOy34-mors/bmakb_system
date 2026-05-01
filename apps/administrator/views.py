# apps/administrator/views.py

from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q, Count, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
from collections import defaultdict
import json

from .forms import AdminRegisterForm, AdminLoginForm
from .models import AdminLog
from .log_utils import log_action, get_client_ip
from apps.membership.models import Member


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

    context = {
        'total_members':     Member.objects.count(),
        'active_members':    Member.objects.filter(is_active=True).count(),
        'inactive_members':  Member.objects.filter(is_active=False).count(),
        'regular_members':   regular_count,
        'associate_members': associate_count,
        'recent_members':    Member.objects.order_by('-created_at')[:5],

        'monthly_labels': json.dumps(monthly_labels),
        'monthly_data':   json.dumps(monthly_data),
        'type_labels':    json.dumps(['Regular', 'Associate']),
        'type_values':    json.dumps([regular_count, associate_count]),
        'revenue_labels': json.dumps(revenue_labels),
        'revenue_data':   json.dumps(revenue_data),
        'total_revenue':  f'{sum(revenue_data):,.2f}',
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
    # Reads the first segment of the address field (before the first comma)
    # which matches the BARANGAYS list format: "Ali-is, Bayawan City, ..."
    barangay_map = defaultdict(lambda: {'total': 0, 'male': 0, 'female': 0})

    for m in Member.objects.values('address', 'gender'):
        raw = (m['address'] or '').strip()
        barangay = raw.split(',')[0].strip() if raw else 'Unknown'
        barangay_map[barangay]['total'] += 1
        if m['gender'] == 'male':
            barangay_map[barangay]['male'] += 1
        elif m['gender'] == 'female':
            barangay_map[barangay]['female'] += 1

    # Sort by total descending; cap at 20 rows so the chart stays readable
    sorted_barangays = sorted(
        barangay_map.items(),
        key=lambda x: x[1]['total'],
        reverse=True,
    )[:20]

    barangay_labels  = [item[0]                 for item in sorted_barangays]
    barangay_data    = [item[1]['total']         for item in sorted_barangays]
    barangay_male    = [item[1]['male']          for item in sorted_barangays]
    barangay_female  = [item[1]['female']        for item in sorted_barangays]

    context = {
        # ── Stat cards ────────────────────────────────────────────────────
        'total_members':     total_members,
        'active_members':    Member.objects.filter(is_active=True).count(),
        'regular_members':   regular_count,
        'associate_members': associate_count,

        # ── Gender stat cards ─────────────────────────────────────────────
        'male_members':    male_count,
        'female_members':  female_count,
        'other_members':   other_count,
        'male_percent':    male_percent,
        'female_percent':  female_percent,
        'other_percent':   other_percent,

        # ── Membership trend chart ────────────────────────────────────────
        'monthly_labels':    json.dumps(monthly_labels),
        'monthly_data':      json.dumps(monthly_data),
        'chart_months_count': len(monthly_labels),

        # ── Membership type donut ─────────────────────────────────────────
        'type_labels':  json.dumps(['Regular', 'Associate']),
        'type_values':  json.dumps([regular_count, associate_count]),

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

