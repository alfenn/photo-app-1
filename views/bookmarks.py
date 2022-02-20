from flask import Response, request
from flask_restful import Resource
from models import Bookmark, db
import json
from . import can_view_post
from my_decorators import secure_bookmark, \
    handle_db_insert_error, check_ownership_of_bookmark, is_valid_int, id_is_integer_or_400_error


class BookmarksListEndpoint(Resource):
    # 1. Lists all of the bookmarks
    # 2. Create a new bookmark

    def __init__(self, current_user):
        self.current_user = current_user
    
    def get(self):
        bookmarks = Bookmark.query.filter_by(
            user_id=self.current_user.id).order_by('id').all()
        bookmark_list_of_dictionaries = [
            bookmark.to_dict() for bookmark in bookmarks
        ]
        return Response(json.dumps(bookmark_list_of_dictionaries), mimetype="application/json", status=200)

    @is_valid_int
    @secure_bookmark
    @handle_db_insert_error
    def post(self):
        '''
        Goal: 
            1. get the post_id from the request body
            2. Check that the user is authorized to bookmark the post
            3. Check that the post_id exists and is valid.
            4. If 1, 2, & 3: insert to the database.
            5. Return the new bookmarked post (and the bookmark id)
               to the user as part of the response.
        '''
        # this is the data that the user sent us:
        body = request.get_json()
        post_id = body.get('post_id')
        
        # to create a Bookmark, you need to pass it a user_id and a post_id
        
        bookmark = Bookmark(self.current_user.id, post_id)
        # these two lines save ("commit") the new record to the database:
        db.session.add(bookmark)
        db.session.commit()
        return Response(json.dumps(bookmark.to_dict()), mimetype="application/json", status=201)

class BookmarkDetailEndpoint(Resource):

    # 1. PATCH (updating), GET (individual bookmarks), DELETE individual bookmarks
    # 2. Create a new bookmark

    def __init__(self, current_user):
        self.current_user = current_user
    
    @id_is_integer_or_400_error
    @check_ownership_of_bookmark
    def delete(self, id):
        # bookmark = Bookmark.query.get(id)

        Bookmark.query.filter_by(id=id).delete()
        db.session.commit()
        serialized_data = {
            'message': 'Bookmark {0} successfully deleted.'.format(id)
        }
        return Response(json.dumps(serialized_data), mimetype="application/json", status=200)




def initialize_routes(api):
    api.add_resource(
        BookmarksListEndpoint, 
        '/api/bookmarks', 
        '/api/bookmarks/', 
        resource_class_kwargs={'current_user': api.app.current_user}
    )

    api.add_resource(
        BookmarkDetailEndpoint, 
        '/api/bookmarks/<id>', 
        '/api/bookmarks/<id>',
        resource_class_kwargs={'current_user': api.app.current_user}
    )