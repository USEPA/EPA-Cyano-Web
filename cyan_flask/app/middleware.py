from functools import wraps
from flask import request, g, abort
import json
import logging

# Local imports:
from auth import JwtHandler


def _check_for_refresh(auth_token):
    """
    Gets new token for valid user if token
    is near expiring.
    """
    expiry_time = JwtHandler().check_time_delta(auth_token["exp"])
    if expiry_time >= 0:
        auth_token = JwtHandler().encode_auth_token(auth_token["sub"])
    return auth_token


def login_required(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        authorization = request.headers.get("authorization", None)
        if not authorization:
            return (
                {"error": "No authorization token provied"},
                401,
                {"Content-type": "application/json"},
            )
        try:
            auth_token = authorization.split(" ")[1]
            resp = JwtHandler().decode_auth_token(auth_token)
            if "error" not in resp:
                g.user = resp["sub"]
                _token = _check_for_refresh(resp)  # gets new token if almost expired
                g.token = _token
            else:
                return resp, 401, {"Content-Type": "application/json"}
        except Exception as e:
            logging.warning("Error in cyan_flask middleware.py: {}".format(e))
            return (
                {"error": "Error authenticating user token"},
                401,
                {"Content-Type": "application/json"},
            )
        return f(*args, **kwargs)

    return wrap
