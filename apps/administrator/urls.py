# apps/administrator/urls.py

from django.urls import path
from . import views

app_name = 'administrator'

urlpatterns = [
    path('',           views.dashboard,      name='dashboard'),
    path('login/',     views.admin_login,    name='login'),
    path('logout/',    views.admin_logout,   name='logout'),
    path('register/',  views.admin_register, name='register'),
    path('analytics/', views.analytics,      name='analytics'),
    path('logs/',     views.admin_logs,   name='admin_logs'),
    path('forgot-password/',  views.forgot_password, name='forgot_password'),
    path('verify-otp/',       views.verify_otp,      name='verify_otp'),
    path('resend-otp/',       views.resend_otp,      name='resend_otp'),
    path('reset-password/',   views.reset_password,  name='reset_password'),
]