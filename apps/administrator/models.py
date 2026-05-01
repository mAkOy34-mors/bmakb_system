# apps/administrator/models.py

from django.contrib.auth.models import AbstractUser
from django.db import models


class Administrator(AbstractUser):

    phone = models.CharField(max_length=20, blank=True)
    profile_picture = models.ImageField(
        upload_to='admin_pics/',
        blank=True,
        null=True,
    )

    class Meta:
        db_table = 'administrator'
        verbose_name = 'Administrator'
        verbose_name_plural = 'Administrators'

    def __str__(self):
        return f"{self.get_full_name() or self.username}"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username