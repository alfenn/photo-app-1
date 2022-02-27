const story2Html = story => {
    return `
        <div>
            <img src="${ story.user.thumb_url }" class="pic" alt="profile pic for ${ story.user.username }" />
            <p>${ story.user.username }</p>
        </div>
    `;
};

// fetch data from your API endpoint:
const displayStories = () => {
    fetch('/api/stories')
        .then(response => response.json())
        .then(stories => {
            const html = stories.map(story2Html).join('\n');
            document.querySelector('.stories').innerHTML = html;
        })
};

const destroyModal = ev => {
    document.querySelector('#modal-container').innerHTML = "";
    document.querySelector('#expanded-post-button').focus();
};

const displayModalUserProfile = user => {
    const html = `    
        <img src="${user.thumb_url}" class="pic" alt="Profile pic for ${user.username}"/>
        <h3>${ user.username }</h3>
    `;
    return html;
};

const displayModalComments = comments => {
    let html = '';
    if (comments.length > 0) {
        for (comment of comments) {
            html += `
                <div class="comment">
                    <img src="${comment.user.thumb_url}" class="pic" alt="Profile pic for ${comment.username}" />
                    <div>
                        <p>
                        <strong>${comment.user.username}</strong> 
                        ${comment.text}
                        </p>
                        <p><strong>${comment.display_time}</strong></p>
                    </div>
                    <button>
                        <i class="far fa-heart"></i>
                    </button>
                </div>
            `;
        }
    }
    return html;
}

const showPostDetail = ev => {
    const postId = ev.currentTarget.dataset.postId;
    fetch(`/api/posts/${postId}`)
        .then(response => response.json())
        .then(post => {
            const html = `
                <div class="modal-bg">
                    <button id="close-modal" onclick="destroyModal(event)">
                        <i class="fa-solid fa-xmark" style="color:white; font-size:2em;"></i>
                    </button>
                    <div class="modal">
                        <div class="modal-img" style="background-image:url('${post.image_url}'); border-radius:5px;"></div>
                        <div style="overflow:scroll;">
                            <header class="user-profile">
                                ${displayModalUserProfile(post.user)}
                            </header>
                            <div class="comments">                         
                                ${displayModalComments(post.comments)}
                            </div>
                        </div>
                    </div>
                </div>`;
            document.querySelector('#modal-container').innerHTML = html;
            document.querySelector('#close-modal').focus();
            ev.target.id = 'expanded-post-button';
        })
    
};

/*
const displayComments = (comments, postID) => {
  
    if (comments && comments.length > 0) {
        const lastComment = comments[comments.length - 1];
        html += `
            <p>
                <strong>${lastComment.user.username}</strong> 
                ${lastComment.text}
            </p>
            <div>${lastComment.display_time}</div>
        `
    }
*/

const addComment = ev => {
    //console.log('ss');
    const elem = ev.currentTarget;
    const commentId = 'comment-for-' + elem.dataset.postId;
    const postData = {
        "post_id": elem.dataset.postId,
        "text": document.getElementById(commentId).value
    };
    
    fetch("/api/comments", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData)
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const postURL = `/api/posts/${elem.dataset.postId}`;
            fetch(postURL)
                .then(response => response.json())
                .then(post => {
                    const html = post2HtmlWithinCard(post);
                    document.querySelector(`.card.postid-${post.id}`).innerHTML = html;
                    
                });
        });
};

const getLastComment = comments => {
    let lastComment = comments[0];
    for (i = 0; i < comments.length; i++) {
        if (comments[i].id > lastComment.id) {
            lastComment = comments[i];
        }
    }
    return lastComment;
}

const displayComments = (comments, postID) => {
    let html = '';
    if (comments.length > 1) {
        html += `
            <button class="link" data-post-id="${postID}" onclick="showPostDetail(event);">
                view all ${comments.length} comments
            </button>
        `;
    }
    if (comments && comments.length > 0) {
        // const lastComment = comments[comments.length - 1];
        const lastComment = getLastComment(comments);
        html += `
            <p>
                <strong>${lastComment.user.username}</strong> 
                ${lastComment.text}
            </p>
            <div>${lastComment.display_time}</div>
        `
    }
    html += `
        <div class="add-comment">
            <div class="input-holder">
                <input type="text" id="comment-for-${postID}" aria-label="Add a comment" placeholder="Add a comment...">
            </div>
            <button 
                    id ="addcommentbutton"
                    class="link"
                    data-post-id="${postID}"
                    onclick="addComment(event)">
                Post</button>
        </div>
    `;
    return html;
};



const toggleLike = ev => {
    const elem = ev.currentTarget;
    if (elem.getAttribute('aria-checked') === 'false') {
        likePost(elem.dataset.postId, elem);        
        setNumLikes(ev, getNumLikes(ev) + 1);
    } else {
        unlikePost(elem.dataset.postId, elem.dataset.likeId, elem);
        setNumLikes(ev, getNumLikes(ev) - 1);
    }
};

const setNumLikes = (ev, num) => {
    const likesElem = ev.currentTarget.parentElement.parentElement.parentElement.querySelector('.likes strong');    
    likesElem.innerHTML = `${ num } like${num != 1 ? 's' : ''}`;
};

const getNumLikes = (ev) => {
    const likesElem = ev.currentTarget.parentElement.parentElement.parentElement.querySelector('.likes strong');
    return Number(likesElem.innerHTML.split(" ")[0]);
};

const likePost = (postId, elem) => {
    const postData = {};

    fetch(`/api/posts/${postId}/likes/`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData)
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            elem.innerHTML = `<i class="fas fa-heart"></i>`;
            // in the event we want to unfollow
            elem.setAttribute('data-like-id', data.id);
            elem.setAttribute('aria-checked', 'true');
        });
};

const unlikePost = (postId, likeId, elem) => {
    const deleteURL = `/api/posts/${postId}/likes/${likeId}`;
    fetch(deleteURL, {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        elem.innerHTML = `<i class="far fa-heart"></i>`;
        elem.removeAttribute('data-like-id');
        elem.setAttribute('aria-checked', 'false');
    });
};


const toggleBookmark = ev => {
    const elem = ev.currentTarget;
    if (elem.getAttribute('aria-checked') === 'false') {
        bookmarkPost(elem.dataset.postId, elem);
    } else {
        unbookmarkPost(elem.dataset.postId, elem.dataset.bookmarkId, elem);
    }
    
};

const bookmarkPost = (postId, elem) => {
    const postData = {
        "post_id": postId
    };
    
    fetch("/api/bookmarks/", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData)
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            elem.innerHTML = `<i class="fas fa-bookmark"></i>`;
            // in the event we want to unfollow
            elem.setAttribute('data-bookmark-id', data.id);
            elem.setAttribute('aria-checked', 'true');
        });
}

const unbookmarkPost = (postId, bookmarkId, elem) => {
    const deleteURL = `/api/bookmarks/${bookmarkId}`;
    
    fetch(deleteURL, {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        elem.innerHTML = `<i class="far fa-bookmark"></i>`;
        elem.removeAttribute('data-bookmark-id');
        elem.setAttribute('aria-checked', 'false');
    });
};

const post2HtmlWithinCard = post => {
    return `
        <div class="header">
            <h3>${ post.user.username } - ${post.current_user_like_id} - ${post.current_user_bookmark_id}</h3>
            <i class="fa fa-dots"></i>
        </div>
        <img src="${ post.image_url }" alt="Image posted by ${ post.user.username }" width="300" height="300">
        <div class="info">
            <div class="buttons">
                <div>
                    <button data-post-id="${post.id}"  aria-label="Like" 
                        aria-checked="${ post.current_user_like_id ? 'true' : 'false' }" 
                        data-like-id="${ post.current_user_like_id ? `${ post.current_user_like_id}` : '' }"
                        onclick="toggleLike(event)">
                        <i class="fa${ post.current_user_like_id ? 's' : 'r' } fa-heart"></i>
                    </button>
                    <i class="far fa-comment"></i>
                    <i class="far fa-paper-plane"></i>
                </div>
                <div>
                    <button data-post-id="${post.id}" aria-label="Bookmark" 
                        aria-checked="${ post.current_user_bookmark_id ? 'true' : 'false' }" 
                        data-bookmark-id="${post.current_user_bookmark_id ? `${ post.current_user_bookmark_id}` : '' }"
                        onclick="toggleBookmark(event)">
                        <i class="fa${ post.current_user_bookmark_id ? 's' : 'r' } fa-bookmark"></i>
                    </button>
                </div>
            </div>
            <p class="likes"><strong>${ post.likes.length } like${post.likes.length != 1 ? 's' : ''}</strong></p>

            <div class="caption">
            <p>
                <strong>${ post.user.username }</strong> 
                ${ post.caption }
            </p>
        </div>
        <div class="comments" id="comments-for-${post.id}">
            ${ displayComments(post.comments, post.id) }
        </div>
    `;
};

const post2Html = post => {
    return `
        <section class="card postid-${post.id}">
            ${post2HtmlWithinCard(post)}
        </section>
    `;
};

// fetch data from your API endpoint:
const displayPosts = () => {
    fetch('/api/posts')
        .then(response => response.json())
        .then(posts => {
            const html = posts.map(post2Html).join('\n');
            document.querySelector('#posts').innerHTML = html;
        })
};


/*
                <img src="{{ suggestion.get('thumb_url') }}" class="pic" alt="Profile pic for {{ suggestion.get('username') }}" />
                <div>
                    <p>{{ suggestion.get('username') }}</p>
                    <p>suggested for you</p>
                </div>
                <div><button class="link">follow</button></div>
*/

const toggleFollow = ev => {
    const elem = ev.currentTarget;
    if (elem.innerHTML === 'follow') {
        followUser(elem.dataset.userId, elem);
    } else {
        unfollowUser(elem.dataset.followingId, elem);
    }
    
};

const followUser = (userId, elem) => {
    const postData = {
        "user_id": userId
    };
    
    fetch("/api/following/", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData)
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            elem.innerHTML = 'unfollow';
            // in the event we want to unfollow
            elem.setAttribute('data-following-id', data.id);
            elem.setAttribute('aria-checked', 'true');
        });
}

const unfollowUser = (followingId, elem) => {
    const deleteURL = `/api/following/${followingId}`;
    fetch(deleteURL, {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        elem.innerHTML = 'follow';
        elem.removeAttribute('data-following-id');
        elem.setAttribute('aria-checked', 'false');
    });
};


const suggestion2Html = suggestion => {
    return `
        <section class="suggestion">
            <img src="${suggestion.thumb_url}" class="pic" alt="Profile pic for ${suggestion.username}" />
            <div>
                    <p>${suggestion.username}</p>
                    <p>suggested for you</p>
            </div>
            <div>
                <button 
                    class="link" 
                    aria-label="Follow" 
                    aria-checked="false"
                    data-user-id="${suggestion.id}"
                    onclick="toggleFollow(event)">follow</button>
            </div>
        </section>
    `;
};

const displaySuggestions = () => {
    fetch('/api/suggestions')
        .then(response => response.json())
        .then(suggestions => {
            const html = suggestions.map(suggestion2Html).join('\n');
            document.querySelector('.suggestions').innerHTML += html;
        })
};


// code for aside header
/* 
    <img src="{{ user.get('profile_url') }}" class="pic" alt="Profile pic for {{ user.get('username') }}"/>
    <h2>{{ user.get('username') }}</h2>
*/

const displayUserProfile = () => {
    fetch('/api/profile')
    .then(response => response.json())
    .then(profile => {
        const html = `    
            <img src="${profile.thumb_url}" class="pic" alt="Profile pic for ${profile.username}"/>
            <h2>${ profile.username }</h2>
            `;
        document.querySelector('.user-profile').innerHTML = html;
    })
};

const initPage = () => {
    displayStories();
    displayPosts();
    displaySuggestions();
    displayUserProfile();
};

document.addEventListener('keydown', (ev) => {
    if (ev.key == "Escape") {
        // if modal is open
        if (document.querySelector('#modal-container').innerHTML !== "") {
            // console.log('escape key pressed and modal is open');
            destroyModal();
        }        
    }
});

// invoke init page to display stories:
initPage();