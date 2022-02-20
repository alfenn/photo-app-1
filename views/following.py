from flask import Response, request
from flask_restful import Resource
from models import Following, User, db
import json
from my_decorators import check_user_exist, \
    handle_db_insert_error, check_ownership_of_following, id_is_integer_or_400_error

def get_path():
    return request.host_url + 'api/posts/'

class FollowingListEndpoint(Resource):
    def __init__(self, current_user):
        self.current_user = current_user
    
    def get(self):
        all_followings = Following.query.filter_by(user_id = self.current_user.id).all()
        data = [
            item.to_dict_following() for item in all_followings
        ]

        return Response(json.dumps(data), mimetype="application/json", status=200)


    @handle_db_insert_error
    @check_user_exist
    def post(self):
        body = request.get_json()
        following_id = body.get('user_id')
        user_id = self.current_user.id # id of the user who is logged in
        
        # create post:
        following = Following(user_id, following_id)
        db.session.add(following)
        db.session.commit()
        return Response(json.dumps(following.to_dict_following()), mimetype="application/json", status=201)
        

class FollowingDetailEndpoint(Resource):
    def __init__(self, current_user):
        self.current_user = current_user
    

    @id_is_integer_or_400_error
    @check_ownership_of_following
    def delete(self, id):

        # a user can only delete their own post:
        following = Following.query.get(id)
        if not following or following.user_id != self.current_user.id:
            return Response(json.dumps({'message': 'Following does not exist'}), mimetype="application/json", status=404)
       

        Following.query.filter_by(id=id).delete()
        db.session.commit()
        serialized_data = {
            'message': 'Post {0} successfully deleted.'.format(id)
        }
        return Response(json.dumps(serialized_data), mimetype="application/json", status=200)

def initialize_routes(api):
    api.add_resource(
        FollowingListEndpoint, 
        '/api/following', 
        '/api/following/', 
        resource_class_kwargs={'current_user': api.app.current_user}
    )
    api.add_resource(
        FollowingDetailEndpoint, 
        '/api/following/<id>', 
        '/api/following/<id>/', 
        resource_class_kwargs={'current_user': api.app.current_user}
    )
