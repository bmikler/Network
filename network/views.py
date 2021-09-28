import json
from django.contrib.auth import authenticate, login, logout
from django.core.paginator import Paginator
from django.db import IntegrityError
from django.db.models.query import QuerySet
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt

from .models import *


def index(request):
    if request.user.is_authenticated:
        return render(request, "network/index.html")
    else:
        return render(request, "network/login.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


@login_required
@csrf_exempt
def posts(request, post_filter, page=1):

    # create new post
    if request.method == 'POST':

        # get text from the form
        data = json.loads(request.body)
        text = data.get("text", "")

        post = Post(creator=request.user, text = text)
        post.save()

    # edit post
    if request.method == "PUT":
        data = json.loads(request.body)

        post = Post.objects.get(id=data.get('id'))

        # backend user validation
        if post.creator.id == request.user.id:
            Post.objects.filter(id=data.get('id')).update(text=data.get('text'))
            return JsonResponse({"message": "post edited"})

    # filter posts

    if post_filter == "all":
        posts = Post.objects.all()

    # all user fallowings
    elif post_filter == "following":
        try:
            following = Following.objects.get(user = request.user.id)
            posts = Post.objects.filter(creator__in=following.following.all())
        except:
            return JsonResponse({"error": "Not followng found"}, status = 404)

    else:
        posts = Post.objects.filter(creator=post_filter)


    sorted_posts = posts.order_by("-timestamp").all()
    posts_paginated = Paginator(sorted_posts, 5)

    one_page_posts_display = posts_paginated.page(page)
   
    return JsonResponse({
        "act_page": page,
        "pages_number": posts_paginated.num_pages,
        "posts": [post.serialize() for post in one_page_posts_display.object_list],
        "has_next": one_page_posts_display.has_next(),
        "has_previous":one_page_posts_display.has_previous()

    })

 # load user profil page
@login_required
@csrf_exempt
def profil_page(request, user_id):

    if request.method == "POST":

        data = json.loads(request.body)
        print(data.get("follow"))
        if data.get("follow") == False:
            # check if actual user already have following table
            try:
                following = Following.objects.get(user = request.user.id)
                following.following.add(user_id)
            except:
                following = Following.objects.create(user = User.objects.get(id = request.user.id))
                following.following.add(user_id)
                following.save()
        
        else:
            following = Following.objects.get(user = request.user.id)
            following.following.remove(user_id)
        
        # udpate follwings counter for loged user
        p = Following.objects.get(user = request.user.id)
        p = len(p.following.all())
        User.objects.filter(id=request.user.id).update(followings = p)

        # udpate follwers counter for user from profile
        q = Following.objects.filter(following__in=user_id)
        q = len(q.all())

        User.objects.filter(id=user_id).update(followers = q)
                
    # get the user form db
    user = User.objects.get(id=user_id)
    username = user.username
    followers = user.followers
    followings = user.followings

    # check if user is fallowed by actual logged user
    
    actual_user_following_list = []
    try:
        for user in Following.objects.get(user=request.user).following.all():
            actual_user_following_list.append(user.id)
    except:
        actual_user_following_list = []


    if int(user_id) in actual_user_following_list:
        isfollow = True
    else:
        isfollow = False


    return JsonResponse({
        "user": username,
        "followings": followings,
        "followers": followers,
        "isfollow": isfollow
        })


@login_required
@csrf_exempt
def like(request, post_id):

    if request.method == 'POST':
        post = Post.objects.get(id=post_id)
        if User.objects.get(id=request.user.id) in post.likes_number.all():
            post.likes_number.remove(User.objects.get(id=request.user.id))
        else:
            post.likes_number.add(User.objects.get(id=request.user.id))

        return JsonResponse({"post id:": post_id})
    
    return JsonResponse({"wrong request method"})

