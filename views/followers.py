from flask import Response, request
from flask_restful import Resource
from models import Following, User
import json

def get_path():
    return request.host_url + 'api/posts/'

class FollowerListEndpoint(Resource):
    def __init__(self, current_user):
        self.current_user = current_user
    
    def get(self):
        # Your code here
        all_followers = Following.query.filter_by(following_id = self.current_user.id).all()
        data = [
            item.to_dict_follower() for item in all_followers
        ]

        return Response(json.dumps(data), mimetype="application/json", status=200)


def initialize_routes(api):
    api.add_resource(
        FollowerListEndpoint, 
        '/api/followers', 
        '/api/followers/', 
        resource_class_kwargs={'current_user': api.app.current_user}
    )
