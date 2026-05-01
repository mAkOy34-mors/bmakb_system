# apps/membership/forms.py

from django import forms
from .models import Member


class MemberForm(forms.ModelForm):

    date_of_birth = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
    )

    class Meta:
        model = Member
        exclude = ['account_number', 'age', 'cbu_balance', 'created_at', 'updated_at',
                   'initial_subscription', 'initial_paid_up']
        widgets = {
            'tin': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'e.g. 123-456-789-000',
            }),
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Full name',
            }),
            'gender': forms.Select(attrs={'class': 'form-select'}),
            'occupation': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Occupation',
            }),
            'address': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 2,
                'placeholder': 'Type barangay to search address...',
                'autocomplete': 'off',
                'style': 'resize:none;',
            }),
            'type_of_membership': forms.Select(attrs={'class': 'form-select'}),
            'subscription': forms.NumberInput(attrs={
                'class': 'form-control',
                'step': '0.01',
                'placeholder': '0.00',
            }),
            'term_years': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': '1',
                'max': '50',
                'placeholder': '1',
            }),
            'con': forms.NumberInput(attrs={
                'class': 'form-control',
                'step': '0.01',
                'placeholder': '0.00',
            }),
            'date_joined': forms.DateInput(attrs={
                'type': 'date',
                'class': 'form-control',
            }),
            'is_active': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }