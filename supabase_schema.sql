-- FacilityH2O Supabase Schema
-- Run this in your Supabase SQL editor to set up the database

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  plan TEXT DEFAULT 'starter',
  trial_ends TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superadmin','admin','operator')),
  name TEXT,
  facilities JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Facilities
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  address TEXT,
  code TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chemistry entries
CREATE TABLE chemistry_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  facility_id TEXT NOT NULL,
  system_type TEXT NOT NULL CHECK (system_type IN ('boiler','chilled')),
  shift TEXT NOT NULL,
  entry_date DATE NOT NULL,
  entry_time TIME,
  tester_name TEXT,
  operator_name TEXT NOT NULL,
  operator_username TEXT,
  readings JSONB NOT NULL,
  notes TEXT,
  has_alerts BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts
CREATE TABLE chemistry_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  facility_id TEXT NOT NULL,
  entry_id UUID REFERENCES chemistry_entries(id),
  system_type TEXT NOT NULL,
  shift TEXT NOT NULL,
  entry_date DATE NOT NULL,
  tester_name TEXT,
  operator_name TEXT NOT NULL,
  out_of_range JSONB NOT NULL,
  email_sent BOOLEAN DEFAULT FALSE,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE chemistry_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chemistry_alerts ENABLE ROW LEVEL SECURITY;
