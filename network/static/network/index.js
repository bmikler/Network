// logged user id
const USER = JSON.parse(document.getElementById('user_id_secure').textContent);


document.addEventListener('DOMContentLoaded', function(){  

    // load all post by default
    posts_views("all");

    // Use buttons to toggle between views
    document.querySelector('#button-new-post').addEventListener('click', () => new_post_view())

    document.querySelector('#button-all-posts').addEventListener('click', () => posts_views("all"));

    document.querySelector('#button-following').addEventListener('click', () => posts_views("following"));

    // user profile button
    document.querySelector('#button-user').addEventListener('click', () => {
        const user_id = document.querySelector('#button-user').dataset.user;
        profile_page(user_id)
    });

});

function posts_views(post_filter){

    if (post_filter == 'all' || post_filter == 'following'){
        document.querySelector('#profile-view').style.display = 'none';
    } else {
        document.querySelector('#profile-view').style.display = 'block';
    }
    document.querySelector('#post-view').style.display = 'block';
    document.querySelector('#new-post-view').style.display = 'none';

    get_posts(post_filter, page_number=1)

}

function get_posts(post_filter, page_number){
    
    fetch(`posts/${post_filter}-${page_number}`)
    .then(response => response.json())
    .then(page => {

        // clear previos posts
        document.querySelector('#post-view').innerHTML = ""
    
        // generate each post
        page.posts.forEach(single_post => {

            postDiv = create_post_div(single_post);

            // add events listeners
            postDiv.querySelector('#post-creator').addEventListener('click', () => profile_page(single_post.creator_id));

            postDiv.querySelector('#likeButton').addEventListener('click', () => {
                like(single_post.id).then(() => get_posts(post_filter, page_number));
            });

            if (postDiv.querySelector('#editButton')){

                postDiv.querySelector('#editButton').addEventListener('click', () => {
                    edit(single_post.id)
                    .then(() => {

                        postDiv.querySelector('#saveButton').addEventListener('click', () =>  {

                            let text = postDiv.querySelector('.post-text').value;
                
                            if (text != ""){
                                save_edit(single_post.id, text)
                                .then(() => get_posts(post_filter, page_number));
                                
                            } else {
                                alert('Post is empty!')
                            }

                        });

                    });
                
                });
            }    

        });

        // create pagination
        pagination(post_filter, page);

    });

}

function create_post_div(single_post){

    // create post div
    const element = document.createElement('div');
    element.classList.add('post')
    element.id = `post${single_post.id}`;

    document.querySelector('#post-view').append(element);

    const username = document.createElement('div');
    username.id = 'post-creator'

    username.innerHTML = `<h4>${single_post.creator}</h4>`

    element.append(username);

    // edit button
    if (single_post.creator_id == USER){
        const edit_button = document.createElement('div');
        edit_button.innerHTML = "<button>Edit</button>";
        edit_button.id = 'editButton';
        element.append(edit_button);

        //create save edition button and hide it
        const save_button = document.createElement('button');
        save_button.classList.add('btn-outline-primary');
        save_button.innerHTML = 'SAVE';
        save_button.id = 'saveButton';
        save_button.style.display = 'none';
        element.append(save_button);
    } 


    const post = document.createElement('div');
    post.innerHTML = 
    `<div class="post-timestamp">Created at ${single_post.timestamp_date} - ${single_post.timestamp_time}</div>
    <textarea disabled class="post-text" id=${single_post.id}>${single_post.text}</textarea>`

    element.append(post);
    
    // create likes number
    const likes = document.createElement('div');
    likes.classList.add("post-likes");
    likes.innerHTML = `<strong>&#128153;${single_post.likes_number}</strong>`
    element.append(likes)
    

    // create like button
    const like_button = document.createElement('button');
    like_button.id = 'likeButton'
    like_button.innerHTML = `Like it!`
    
    // check if user already like this post
    if (single_post.likes_users.includes(USER)){
        like_button.classList.add('btn-primary')
    } else {
        
        like_button.classList.add('btn-outline-primary')
    }
    element.append(like_button);


    return element

}

async function like(single_post){

    await fetch(`like/${single_post}`, {
        method: 'POST'
    })

}

async function edit(single_post){
    //unlock post text area 
        postDiv = document.querySelector(`#post${single_post}`);
        postDiv.querySelector('.post-text').disabled=false;
        postDiv.querySelector('.post-text').focus();
        //hide the edit button
        postDiv.querySelector('#editButton').style.display ='none';
        postDiv.querySelector('#saveButton').style.display ='inline-block';

}

async function save_edit(single_post, text){

    await fetch(`posts/all-1`, {
        method: 'PUT',
        body: JSON.stringify({
            id: single_post,
            text: text
        })
    })
}

function new_post_view(){

    document.querySelector('#profile-view').style.display = 'none';
    document.querySelector('#new-post-view').style.display = 'block';
    document.querySelector('#post-view').style.display = 'block';
    
    document.querySelector('#new-post-text').focus();
    // create new post
    document.querySelector('#new-post-form').addEventListener('submit', () => {

        if (document.querySelector('#new-post-text').value){
        create_new_post_view()
        } else {
            alert("There is no text!")
        }

    });
}

function create_new_post_view(){

    fetch('posts/all-1',{
        method: 'POST',
        body: JSON.stringify({
            text: post_text = document.querySelector('#new-post-text').value
        })
    })
    .then(() => {
        posts_views('all')
    })
    
}

function pagination(post_filter, page){

    // pagination

    const pagination = document.querySelector('#pagination-view #pagination-buttons');

    pagination.innerHTML = "";
    
    if (page.pages_number > 1){

       //previous button
       if (page.has_previous){
           const page_num_button = document.createElement('li');
           page_num_button.classList.add('page-item');
           page_num_button.innerHTML = `<a class="page-link"><</a>`

           pagination.append(page_num_button);

           let page_number = page.act_page - 1;

           page_num_button.addEventListener('click', () => get_posts(post_filter, page_number));
       }

       for (let i = 0; i < page.pages_number; i++){

           const page_num_button = document.createElement('li');
           page_num_button.classList.add('page-item')

           if ((page.act_page - i) > 3 || (i - page.act_page) > 1){
               
               continue
           } else {
               page_num_button.innerHTML = `<a class="page-link">${i+1}</a>`
           }

           pagination.append(page_num_button);

           if((i + 1) == page.act_page){
               page_num_button.querySelector(".page-link").style.background = "rgb(12, 94, 89)";
               page_num_button.querySelector(".page-link").style.color = "white";
           }

           let page_number = i+1;
           page_num_button.addEventListener('click', () => get_posts(post_filter, page_number));
       }

       // next button
       if (page.has_next){
           const page_num_button = document.createElement('li');
           page_num_button.classList.add('page-item');
           page_num_button.innerHTML = `<a class="page-link">></a>`

           pagination.append(page_num_button);

           let page_number = page.act_page + 1;

           page_num_button.addEventListener('click', () => get_posts(post_filter, page_number));
       }
       
    }

}

function profile_page(user_id){

    document.querySelector('#profile-view').style.display = 'block';
    document.querySelector('#post-view').style.display = 'block';
    document.querySelector('#new-post-view').style.display = 'none';

    fetch(`user/${user_id}`)
        .then(response => response.json())
        .then(user => {

            // create user profile
            // add username
            document.querySelector('#username').innerHTML = 
            `<h1>${user.user}</h1>`;

            // user followings and followers
            document.querySelector('#followers').innerHTML = 
            `${user.followers}`;

            document.querySelector('#followings').innerHTML = 
            `${user.followings}`;


            // follow/unfollow button
            // clear previous button
            document.querySelector('#profile-button').innerHTML = ""

            // check if profil page blengs to actual user
            if (!(USER == user_id)){
                
                const button = document.createElement('button');
                button.id = 'button-follow'
                button.classList.add('btn-primary')

                // set the button name follow/unfollow
                if (user.isfollow === true){
                                   
                    button.innerHTML = 'Unfollow';

                } else {

                    button.innerHTML = 'Follow';
                    
                }

                document.querySelector('#profile-button').append(button);

                document.querySelector('#button-follow').addEventListener('click', () => {
                
                follow(user_id, user.isfollow).then(() =>profile_page(user_id));
                });
            }     
        });

    posts_views(user_id);
}

async function follow(user_id, isfollow){

    await fetch(`user/${user_id}`, {
        method: 'POST',
        body: JSON.stringify({
            follow: isfollow
        })
    })

}








