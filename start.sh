#!/bin/bash
cd "$(dirname "$0")"
/usr/bin/python3 -m uvicorn backend.main:app --reload --port 8000
