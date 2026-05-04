# BMAKB Membership Management System

A web-based admin-controlled system for managing BMAKB members, financial transactions, and membership statuses. This document describes the system's architecture, features, and process flows as documented in the system flowchart.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Flow](#system-flow)
  - [Authentication](#authentication)
  - [Dashboard](#dashboard)
  - [Add Member](#add-member)
  - [View All Members](#view-all-members)
  - [Member Actions](#member-actions)
  - [Admin Logs](#admin-logs)
- [Member Data](#member-data)
- [Financial Transactions](#financial-transactions)
- [Membership Types](#membership-types)
- [Member Status](#member-status)
- [Flowchart](#flowchart)

---

## Overview

The BMAKB Membership Management System is designed to give BMAKB administrators full control over membership lifecycle management. It handles everything from onboarding new members and recording financial transactions to deactivating, reactivating, or permanently removing members — all with a complete audit trail through admin logs.

---

## Features

- **Admin authentication** — Secure registration and login with access control
- **Member management** — Add, view, edit, and delete member records
- **Financial transactions** — Record savings, capital build-up (CBU), and paid-up capital with full transaction history
- **Status control** — Deactivate and reactivate members with documented reasons
- **Admin logs** — Full audit trail of all admin actions
- **Analytics dashboard** — Overview of membership and financial data

---

## System Flow

### Authentication

The system starts with an authentication gate. Admins can either register a new admin account or log in with existing credentials.

- **Admin Register** — Creates a new admin account
- **Admin Login** — Authenticates the admin; on failure, the admin is redirected back to the login screen; on success, the admin proceeds to the Dashboard

### Dashboard

After a successful login, the admin is brought to the main Dashboard, which serves as the central navigation hub with four main sections:

| Section | Description |
|---|---|
| Analytics | Overview of membership and financial metrics |
| Admin Logs | History of all admin-performed actions |
| All Members | Full list of registered members with actions |
| Add Member | Form to register a new member |

### Add Member

Adding a new member is a two-stage form process:

**Stage 1 — Personal Details**

| Field | Description |
|---|---|
| Name | Full name of the member |
| TIN Number | Tax Identification Number |
| Address | Member's residential address |
| Age | Member's age |
| Birthdate | Date of birth |
| Occupation | Current occupation |
| Membership Type | Regular or Associate |

**Stage 2 — Financial Details**

| Field | Description |
|---|---|
| Subscription | Membership subscription amount |
| Term (Years) | Duration of membership term |
| Initial Paid-Up Capital | Starting paid-up capital amount |
| Savings | Initial savings deposit |
| CBU (Capital Build-Up) | Initial CBU contribution |

After both stages are completed, clicking **Save Member** creates the record and redirects the admin to the All Members list.

### View All Members

The All Members page displays a data table with the following columns:

| Column | Description |
|---|---|
| Account No. | Unique member account number |
| Name | Full name |
| TIN | Tax Identification Number |
| Type | Regular or Associate |
| Age | Member's age |
| Gender | Member's gender |
| Date Joined | Date of membership registration |
| Status | Active or Inactive |
| Actions | Available action buttons for this member |

### Member Actions

Clicking on a member opens an action menu with five possible operations:

#### 1. Edit Member Info
Update the member's personal details (e.g., occupation, address). Changes are saved immediately upon confirmation.

#### 2. Add Financial Transaction
Record a new financial transaction for the member. This updates the member's:
- Savings balance
- Initial Paid-Up Capital
- CBU (Capital Build-Up)

> **Note:** Financial data cannot be edited directly. All changes to financial records must go through the transaction system, which logs every entry automatically.

#### 3. Deactivate Member
Temporarily suspend a member's account. Requires:
- **Reason for deactivation** — Why the member is being deactivated
- **Resolution** — Any resolution or notes related to the deactivation

Member status is changed to **Inactive**.

#### 4. Reactivate Member
Restore a previously deactivated member's account. Requires:
- **Reactivation notes** — Reason or notes for reactivation

Member status is changed back to **Active**.

#### 5. Delete Member (Permanent)
Permanently removes a member and all associated records from the system. Requires explicit confirmation before deletion. **This action cannot be undone.**

### Admin Logs

The Admin Logs section records every action performed by any administrator, providing a complete audit trail. Logged events include:

- Adding a new member
- Editing member information
- Recording financial transactions
- Deactivating a member
- Reactivating a member
- Deleting a member

Logs are accessible from the Dashboard and are also updated automatically after every member action.

---

## Member Data

### Personal Information
- Full name
- TIN (Tax Identification Number)
- Address
- Age & Birthdate
- Occupation
- Gender

### Financial Information
- Savings
- Initial Paid-Up Capital
- CBU (Capital Build-Up)
- Subscription
- Membership Term

---

## Financial Transactions

All financial records are **append-only** — administrators cannot directly modify existing financial data. Every change to a member's financial standing must be made through a new transaction entry, which is automatically recorded in the admin logs. This ensures full traceability and prevents unauthorized data manipulation.

---

## Membership Types

| Type | Description |
|---|---|
| **Regular** | Full BMAKB member with complete membership rights and privileges |
| **Associate** | Associate member with limited membership rights as defined by BMAKB's by-laws |

---

## Member Status

| Status | Description |
|---|---|
| **Active** | Member is in good standing and has full access to BMAKB services |
| **Inactive** | Member has been deactivated; access to BMAKB services is suspended pending resolution |

---

## Flowchart

The system flowchart is included in this repository as a draw.io-compatible XML file:

**File:** `cooperative_membership_flowchart.xml`

To open:
1. Go to [draw.io](https://draw.io)
2. Click **File → Open from → Device**
3. Select `cooperative_membership_flowchart.xml`

The flowchart covers the complete BMAKB system flow from authentication through logout, including all member action branches and the admin logs pipeline.

---

> **Admin access only.** All operations in this system are restricted to authenticated BMAKB administrators. There is no member-facing portal described in this system.
