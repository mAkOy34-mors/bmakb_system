# apps/membership/views.py

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q

from .models import Member
from .forms import MemberForm
from apps.administrator.log_utils import log_action


# ── Member List ───────────────────────────────────────────────────────────────
@login_required
def member_list(request):
    query           = request.GET.get('q', '')
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
        'members':         members,
        'query':           query,
        'membership_type': membership_type,
        'total':           members.count(),
    }
    return render(request, 'membership/member_list.html', context)


# ── Add Member ────────────────────────────────────────────────────────────────
@login_required
def member_add(request):
    if request.method == 'POST':
        form = MemberForm(request.POST)
        if form.is_valid():
            member = form.save()

            log_action(
                request, 'member_add',
                target_name=member.name,
                target_id=member.account_number,
                description=(
                    f"New {member.get_type_of_membership_display()} member added. "
                    f"TIN: {member.tin}. "
                    f"Subscription: ₱{member.subscription:,.2f}."
                ),
            )

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
        'form':      form,
        'title':     'Add New Member',
        'btn_label': 'Save Member',
    })


# ── Member Detail ─────────────────────────────────────────────────────────────
@login_required
def member_detail(request, pk):
    member = get_object_or_404(Member, pk=pk)

    log_action(
        request, 'member_view',
        target_name=member.name,
        target_id=member.account_number,
        description=f"Viewed profile of {member.name} ({member.account_number}).",
    )

    return render(request, 'membership/member_detail.html', {'member': member})


# ── Edit Member ───────────────────────────────────────────────────────────────
@login_required
def member_edit(request, pk):
    member = get_object_or_404(Member, pk=pk)

    if request.method == 'POST':
        form = MemberForm(request.POST, instance=member)
        if form.is_valid():
            # Capture which fields changed before saving
            changed = form.changed_data
            form.save()

            log_action(
                request, 'member_edit',
                target_name=member.name,
                target_id=member.account_number,
                description=(
                    f"Updated fields: {', '.join(changed) if changed else 'no changes detected'}."
                ),
                severity='warning',
            )

            messages.success(request, f'Member "{member.name}" updated successfully!')
            return redirect('membership:member_detail', pk=member.pk)
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = MemberForm(instance=member)

    return render(request, 'membership/member_form.html', {
        'form':      form,
        'member':    member,
        'title':     f'Edit Member — {member.name}',
        'btn_label': 'Update Member',
    })


# ── Delete Member ─────────────────────────────────────────────────────────────
@login_required
def member_delete(request, pk):
    member = get_object_or_404(Member, pk=pk)

    if request.method == 'POST':
        # Capture details BEFORE the record is gone
        name           = member.name
        account_number = member.account_number
        membership     = member.get_type_of_membership_display()

        member.delete()

        log_action(
            request, 'member_delete',
            target_name=name,
            target_id=account_number,
            description=(
                f"{membership} member {name} ({account_number}) permanently deleted."
            ),
            severity='danger',
        )

        messages.success(request, f'Member "{name}" deleted successfully.')
        return redirect('membership:member_list')

    return render(request, 'membership/member_confirm_delete.html', {'member': member})