
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("posts/<str:post_filter>-<int:page>", views.posts, name="posts"),
    path("user/<str:user_id>", views.profil_page, name="profil_page"),
    path("like/<str:post_id>", views.like, name="like"),
]
