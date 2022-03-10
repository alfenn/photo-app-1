# from sys import _uninstantiable_structseq
from flask import Response, request
from flask_restful import Resource
from models import LikePost, db, Post
import json
from . import can_view_post
from my_decorators import like_id_is_integer_or_400_error, \
    handle_db_insert_error, check_ownership_of_like, is_valid_int, id_is_integer_or_400_error, secure_post
import flask_jwt_extended

class PostLikesListEndpoint(Resource):

    def __init__(self, current_user):
        self.current_user = current_user
    
    @flask_jwt_extended.jwt_required()
    @handle_db_insert_error
    def post(self, post_id):
        user_id = self.current_user.id # id of the user who is logged in
        post = Post.query.get(post_id)
        if post and can_view_post(post_id, self.current_user):
            
            likePost = db.session.query(LikePost).filter(LikePost.user_id==user_id, LikePost.post_id==post_id).all()
            if len(likePost) > 0:
                return Response(json.dumps({'message': 'Duplicate like.'}), mimetype="application/json", status=400)
            # create post:
            like = LikePost(user_id, post_id)
            db.session.add(like)
            db.session.commit()
            return Response(json.dumps(like.to_dict()), mimetype="application/json", status=201)

        else:
            response_obj = {
                'message': 'You don\'t have access to post_id={0}'.format(post_id)
            }
            return Response(json.dumps(response_obj), mimetype="application/json", status=404)
            


class PostLikesDetailEndpoint(Resource):

    def __init__(self, current_user):
        self.current_user = current_user

    @flask_jwt_extended.jwt_required()
    @like_id_is_integer_or_400_error
    @check_ownership_of_like
    def delete(self, post_id, id):
        post = Post.query.get(post_id)
        if not post:
            return Response(json.dumps({'message': 'Post does not exist'}), mimetype="application/json", status=404)
        if not can_view_post(post_id, self.current_user):
            return Response(json.dumps({'message': 'You don\'t have access to post_id={0}'.format(post_id)}), mimetype="application/json", status=404)

        LikePost.query.filter_by(id=id).delete()
        db.session.commit()
        serialized_data = {
            'message': 'Like {0} successfully deleted.'.format(id)
        }
        return Response(json.dumps(serialized_data), mimetype="application/json", status=200)

    

def initialize_routes(api):
    api.add_resource(
        PostLikesListEndpoint, 
        '/api/posts/<post_id>/likes', 
        '/api/posts/<post_id>/likes/', 
        resource_class_kwargs={'current_user': flask_jwt_extended.current_user}
    )

    api.add_resource(
        PostLikesDetailEndpoint, 
        '/api/posts/<post_id>/likes/<id>', 
        '/api/posts/<post_id>/likes/<id>/',
        resource_class_kwargs={'current_user': flask_jwt_extended.current_user}
    )
