# apps/administrator/log_utils.py

from .models import AdminLog


def get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def log_action(request, action, *,
               target_name='', target_id='',
               description='', severity='info'):
    """
    Record an admin action tied to the currently logged-in Administrator.

    Parameters
    ----------
    request     : HttpRequest
    action      : str  — one of AdminLog.ACTION_CHOICES keys
    target_name : str  — human-readable name of the affected object
    target_id   : str  — account number / PK of the affected object
    description : str  — optional free-text note
    severity    : 'info' | 'warning' | 'danger'

    Usage
    -----
    from .log_utils import log_action

    log_action(request, 'member_add',
               target_name=member.name,
               target_id=member.account_number,
               description=f"New {member.type_of_membership} member created.")

    log_action(request, 'member_delete',
               target_name=member.name,
               target_id=member.account_number,
               severity='danger',
               description=f"Member {member.account_number} permanently deleted.")
    """
    admin = request.user if request.user.is_authenticated else None
    AdminLog.objects.create(
        admin=admin,
        action=action,
        severity=severity,
        target_name=target_name,
        target_id=target_id,
        description=description,
        ip_address=get_client_ip(request),
    )