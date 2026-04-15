
import os
import sys
import inspect
from fastapi import FastAPI
from fastapi.routing import APIRoute

# Add the current directory to sys.path to import app
sys.path.append(os.getcwd())

from app.main import app

def inspect_login_route():
    for route in app.routes:
        if isinstance(route, APIRoute) and route.path == "/api/auth/login":
            print(f"Path: {route.path}")
            print(f"Name: {route.name}")
            print(f"File: {inspect.getfile(route.endpoint)}")
            print(f"Line: {inspect.getsourcelines(route.endpoint)[1]}")
            print(f"Methods: {route.methods}")
            
            # Check body parameters
            if hasattr(route, "body_field") and route.body_field:
                print(f"Body Field Name: {route.body_field.name}")
                print(f"Type: {route.body_field.type_}")
                if hasattr(route.body_field.type_, "model_fields"):
                    print(f"Fields: {route.body_field.type_.model_fields.keys()}")
                elif hasattr(route.body_field.type_, "__fields__"):
                    print(f"Fields: {route.body_field.type_.__fields__.keys()}")
            
            # Check dependant parameters
            dependant = route.dependant
            print(f"Body Params: {[p.name for p in dependant.body_params]}")
            print(f"Query Params: {[p.name for p in dependant.query_params]}")

if __name__ == "__main__":
    inspect_login_route()
