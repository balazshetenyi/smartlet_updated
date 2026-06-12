#!/usr/bin/env bash
set -e

cleanup() {
  echo ""
  echo "▸ Shutting down..."
  kill $(jobs -p) 2>/dev/null || true
  wait 2>/dev/null
}
trap cleanup EXIT INT TERM

echo "▸ Starting Supabase..."
supabase start

echo "▸ Starting edge functions..."
supabase functions serve &

echo "▸ Starting dev servers..."
turbo run dev
