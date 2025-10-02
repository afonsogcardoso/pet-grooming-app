# Feature 1: Customer Database - Setup Instructions

## Overview
This feature adds a complete customer and pet management system to your pet grooming app, replacing text inputs with a proper database-backed customer/pet selection system.

## What's Included

### Database Tables
- **customers** - Store customer information (name, phone, email, address, notes)
- **pets** - Store pet information linked to customers (name, breed, age, weight, medical notes)
- **Updated appointments** - Now links to customers and pets via foreign keys

### New Files Created
1. `migrations/001_customer_database.sql` - Database migration
2. `lib/customerService.js` - Customer/pet CRUD operations
3. `components/CustomerForm.js` - Add/edit customer form
4. `components/PetForm.js` - Add/edit pet form
5. `components/CustomerManager.js` - Customer list with search and management
6. `components/PetManager.js` - Pet management per customer
7. `app/customers/page.js` - Customer management page

### Updated Files
1. `components/AppointmentForm.js` - Now uses customer/pet dropdowns instead of text inputs
2. `app/layout.js` - Added navigation between Appointments and Customers

## Installation Steps

### Step 1: Run Database Migration

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open the file `migrations/001_customer_database.sql`
4. Copy all the SQL code
5. Paste it into the Supabase SQL Editor
6. Click **Run** to execute the migration

This will:
- Create `customers` table
- Create `pets` table
- Add `customer_id` and `pet_id` columns to `appointments` table
- Create indexes for performance
- Set up Row Level Security policies
- Create a `customer_summary` view

### Step 2: Verify Installation

After running the migration, verify in Supabase:
1. Go to **Table Editor**
2. You should see:
   - `customers` table
   - `pets` table
   - `appointments` table (with new columns)

### Step 3: Test the Application

1. Start your development server:
```bash
npm run dev
```

2. Navigate to **http://localhost:3000/customers**

3. Test the workflow:
   - Click **"+ New Customer"** to add a customer
   - Click on a customer card to view details
   - Click **"+ Add Pet"** to add pets for that customer
   - Go back to **Appointments** page
   - Click **"+ New Appointment"**
   - Select customer from dropdown
   - Select pet from dropdown (automatically loads customer's pets)
   - Complete the appointment form

## Features

### Customer Management
- ✅ **Search customers** by name or phone
- ✅ **Add/Edit/Delete customers**
- ✅ **View customer details** with stats (pet count, appointment count, last visit)
- ✅ **Customer notes** for special requirements

### Pet Management
- ✅ **Add multiple pets per customer**
- ✅ **Track breed, age, weight**
- ✅ **Medical notes** for allergies, medications, etc.
- ✅ **Edit/Delete pets**

### Appointment Integration
- ✅ **Customer dropdown** - Select from existing customers
- ✅ **Pet dropdown** - Automatically loads pets for selected customer
- ✅ **Phone auto-fill** - Pulls from customer data
- ✅ **Link to add customers** - Quick access if customer doesn't exist
- ✅ **Appointment history** - View all appointments per customer

### Navigation
- ✅ **Header navigation** between Appointments and Customers pages
- ✅ **Mobile-responsive** design

## Database Schema

### customers
```sql
- id (UUID, primary key)
- name (TEXT, required)
- phone (TEXT, required)
- email (TEXT, optional)
- address (TEXT, optional)
- notes (TEXT, optional)
- created_at (TIMESTAMP)
```

### pets
```sql
- id (UUID, primary key)
- customer_id (UUID, foreign key → customers)
- name (TEXT, required)
- breed (TEXT, optional)
- age (INTEGER, optional)
- weight (DECIMAL, optional)
- medical_notes (TEXT, optional)
- created_at (TIMESTAMP)
```

### appointments (updated)
```sql
- ... existing columns ...
- customer_id (UUID, foreign key → customers, nullable)
- pet_id (UUID, foreign key → pets, nullable)
```

## Important Notes

### Backward Compatibility
- Existing appointments still work (customer_name, pet_name, phone fields remain)
- New appointments save both the IDs and names for flexibility
- Old appointments without customer_id/pet_id will continue to display

### Data Migration
If you have existing appointments with customer_name/pet_name:
1. You can manually create customers and pets
2. Then update appointments to link to them
3. Or continue using both systems in parallel

### Future Enhancements Ready
This structure supports:
- Customer appointment history ✅ (already implemented)
- Customer loyalty tracking
- Pet vaccination records
- Recurring appointments for same customer/pet
- SMS/WhatsApp integration using customer phone numbers

## Troubleshooting

### "Error loading customers"
- Check Supabase connection in `lib/supabase.js`
- Verify `.env.local` has correct credentials:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
  ```

### "No pets found"
- Customers need pets added first
- Click on customer → "+ Add Pet"

### RLS (Row Level Security) Issues
- Current policies allow all operations
- Adjust in `migrations/001_customer_database.sql` if you need authentication

### Migration Errors
- If migration fails, check existing table structure
- You may need to drop and recreate if schema conflicts exist
- Always backup data first!

## Next Steps

Feature 1 is now complete! Ready to move on to:
- **Feature 2**: Pricing & Invoicing
- **Feature 3**: WhatsApp Reminders
- **Feature 4**: Recurring Appointments
- **Feature 5**: Customer Portal

## Support

For issues:
1. Check Supabase logs in dashboard
2. Check browser console for errors
3. Verify all files are created correctly
4. Ensure migration ran successfully
