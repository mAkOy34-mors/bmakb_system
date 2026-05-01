# apps/administrator/views.py

from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import AdminRegisterForm, AdminLoginForm


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
            messages.success(
                request,
                f'Welcome back, {user.get_full_name()}!'
            )
            return redirect(request.GET.get('next', 'administrator:dashboard'))
        else:
            messages.error(request, 'Invalid username or password.')
    else:
        form = AdminLoginForm()

    return render(request, 'administrator/login.html', {'form': form})


# ── Logout ────────────────────────────────────────────────────────────────────
@login_required
def admin_logout(request):
    logout(request)
    messages.success(request, 'You have been logged out successfully.')
    return redirect('administrator:login')


# ── Dashboard ─────────────────────────────────────────────────────────────────
@login_required
def dashboard(request):
    from apps.membership.models import Member
    context = {
        'total_members':     Member.objects.count(),
        'active_members':    Member.objects.filter(is_active=True).count(),
        'inactive_members':  Member.objects.filter(is_active=False).count(),
        'regular_members':   Member.objects.filter(type_of_membership='regular').count(),
        'associate_members': Member.objects.filter(type_of_membership='associate').count(),
        'recent_members':    Member.objects.order_by('-created_at')[:5],
    }
    return render(request, 'administrator/dashboard.html', context)