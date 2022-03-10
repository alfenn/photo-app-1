from flask import (
    request, make_response, render_template, redirect
)
from models import User
import flask_jwt_extended
from flask_jwt_extended import unset_jwt_cookies

def logout():
    # hint:  https://dev.to/totally_chase/python-using-jwt-in-cookies-with-a-flask-app-and-restful-api-2p75
    response = make_response(redirect('/login', 302))
    unset_jwt_cookies(response)
    return response

def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        if not username:
            return render_template(
            'login.html', 
            message='Missing username'
            )
        if not password:
            return render_template(
            'login.html', 
            message='Missing password'
            )
        
        user = User.query.filter_by(username=username).one_or_none()
        if user:
            if user.check_password(password):
                #print("the user is authenticated")
                access_token = flask_jwt_extended.create_access_token(identity=user.id)

                response = make_response(redirect('/'))
                flask_jwt_extended.set_access_cookies(response, access_token)
                return response

            else:
                return render_template(
                    'login.html', 
                    message='Wrong password'
                )
        else:
            return render_template(
                    'login.html', 
                    message='Wrong username'
                )
        # authenticate user here. If the user sent valid credentials, set the
        # JWT cookies:
        # https://flask-jwt-extended.readthedocs.io/en/3.0.0_release/tokens_in_cookies/
        return render_template(
            'login.html', 
            message='Invalid password'
        )
    else:
        return render_template(
            'login.html'
        )

def initialize_routes(app):
    app.add_url_rule('/login', 
        view_func=login, methods=['GET', 'POST'])
    app.add_url_rule('/logout', view_func=logout)