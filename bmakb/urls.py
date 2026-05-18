# config/urls.py
from django.contrib.staticfiles.storage import staticfiles_storage
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView

urlpatterns = [
    path('', RedirectView.as_view(url='/administrator/')),
    path('administrator/', include('apps.administrator.urls')),
    path('members/',       include('apps.membership.urls')),
    path('register/', RedirectView.as_view(url='/administrator/login/')),
    path('favicon.ico', RedirectView.as_view(url=staticfiles_storage.url('images/favicon.ico'), permanent=True)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)