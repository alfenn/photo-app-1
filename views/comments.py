from flask import Response, request
from flask_restful import Resource
from . import can_view_post
import json
from models import db, Comment, Post
from my_decorators import secure_bookmark, \
    handle_db_insert_error, check_ownership_of_comment, is_valid_int, id_is_integer_or_400_error, secure_post

class CommentListEndpoint(Resource):

    def __init__(self, current_user):
        self.current_user = current_user
    
    @handle_db_insert_error
    def post(self):
        body = request.get_json()
        text = body.get('text')
        post_id = body.get('post_id')
        user_id = self.current_user.id # id of the user who is logged in
        
        post = Post.query.get(post_id)
        if post and can_view_post(post_id, self.current_user):
            # create comment:
            comment = Comment(text, user_id, post_id)
            db.session.add(comment)
            db.session.commit()
            return Response(json.dumps(comment.to_dict()), mimetype="application/json", status=201)
        else:
            response_obj = {
                'message': 'You don\'t have access to post_id={0}'.format(post_id)
            }
            return Response(json.dumps(response_obj), mimetype="application/json", status=404)

class CommentDetailEndpoint(Resource):

    def __init__(self, current_user):
        self.current_user = current_user
  
    @id_is_integer_or_400_error
    @check_ownership_of_comment
    def delete(self, id):

        Comment.query.filter_by(id=id).delete()
        db.session.commit()
        serialized_data = {
            'message': 'Comment {0} successfully deleted.'.format(id)
        }
        return Response(json.dumps(serialized_data), mimetype="application/json", status=200)

def initialize_routes(api):
    api.add_resource(
        CommentListEndpoint, 
        '/api/comments', 
        '/api/comments/',
        resource_class_kwargs={'current_user': api.app.current_user}

    )
    api.add_resource(
        CommentDetailEndpoint, 
        '/api/comments/<id>', 
        '/api/comments/<id>',
        resource_class_kwargs={'current_user': api.app.current_user}
    )
