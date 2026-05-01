# apps/membership/views.py

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from .models import Member
from .forms import MemberForm


# ── Member List ───────────────────────────────────────────────────────────────
@login_required
def member_list(request):
    query = request.GET.get('q', '')
    membership_type = request.GET.get('type', '')

    members = Member.objects.all()

    if query:
        members = members.filter(
            Q(name__icontains=query) |
            Q(account_number__icontains=query) |
            Q(tin__icontains=query)
        )

    if membership_type:
        members = members.filter(type_of_membership=membership_type)

    context = {
        'members': members,
        'query': query,
        'membership_type': membership_type,
        'total': members.count(),
    }
    return render(request, 'membership/member_list.html', context)


# ── Add Member ────────────────────────────────────────────────────────────────
@login_required
def member_add(request):
    if request.method == 'POST':
        form = MemberForm(request.POST)
        if form.is_valid():
            member = form.save()
            messages.success(
                request,
                f'Member "{member.name}" added successfully! '
                f'Account No: {member.account_number}'
            )
            return redirect('membership:member_list')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = MemberForm()

    return render(request, 'membership/member_form.html', {
        'form': form,
        'title': 'Add New Member',
        'btn_label': 'Save Member',
    })


# ── Member Detail ─────────────────────────────────────────────────────────────
@login_required
def member_detail(request, pk):
    member = get_object_or_404(Member, pk=pk)
    return render(request, 'membership/member_detail.html', {'member': member})


# ── Edit Member ───────────────────────────────────────────────────────────────
@login_required
def member_edit(request, pk):
    member = get_object_or_404(Member, pk=pk)

    if request.method == 'POST':
        form = MemberForm(request.POST, instance=member)
        if form.is_valid():
            form.save()
            messages.success(request, f'Member "{member.name}" updated successfully!')
            return redirect('membership:member_detail', pk=member.pk)
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = MemberForm(instance=member)

    return render(request, 'membership/member_form.html', {
        'form': form,
        'member': member,
        'title': f'Edit Member — {member.name}',
        'btn_label': 'Update Member',
    })


# ── Delete Member ─────────────────────────────────────────────────────────────
@login_required
def member_delete(request, pk):
    member = get_object_or_404(Member, pk=pk)

    if request.method == 'POST':
        name = member.name
        member.delete()
        messages.success(request, f'Member "{name}" deleted successfully.')
        return redirect('membership:member_list')

    return render(request, 'membership/member_confirm_delete.html', {'member': member})