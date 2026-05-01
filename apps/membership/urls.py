# apps/membership/urls.py

from django.urls import path
from . import views

app_name = 'membership'

urlpatterns = [
    path('',                    views.member_list,   name='member_list'),
    path('add/',                views.member_add,    name='member_add'),
    path('<int:pk>/',           views.member_detail, name='member_detail'),
    path('<int:pk>/edit/',      views.member_edit,   name='member_edit'),
    path('<int:pk>/delete/',    views.member_delete, name='member_delete'),
]