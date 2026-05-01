# apps/administrator/urls.py

from django.urls import path
from . import views

app_name = 'administrator'

urlpatterns = [
    path('',           views.dashboard,      name='dashboard'),
    path('login/',     views.admin_login,    name='login'),
    path('logout/',    views.admin_logout,   name='logout'),
    path('register/',  views.admin_register, name='register'),
]