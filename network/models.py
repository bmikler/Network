from typing import Text
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.deletion import CASCADE
from django.db.models.fields.related import ForeignKey, create_many_to_many_intermediary_model


class User(AbstractUser):
    followers = models.PositiveIntegerField(default=0)
    followings = models.PositiveIntegerField(default=0)

    def __str__(self) -> str:
        return f"{self.id}"


class Post(models.Model):
    creator = ForeignKey(User, on_delete=CASCADE, related_name="post_creator")
    text = models.CharField(max_length=600)
    timestamp = models.DateTimeField(auto_now_add=True)
    likes_number = models.ManyToManyField(User, blank=True, related_name="liker")

    def serialize(self):
        return {
            "id": self.id,
            "creator": self.creator.username,
            "creator_id": self.creator.id,
            "text": self.text,
            "timestamp_time": f"{self.timestamp.hour}:{self.timestamp.minute}",
            "timestamp_date": f"{self.timestamp.day}/{self.timestamp.month}/{self.timestamp.year}",
            "likes_number": len(self.likes_number.all()),
            "likes_users": [user.id for user in self.likes_number.all()]
        }

    def __str__(self) -> str:
        return f'{self.creator}: {self.text}'

class Following(models.Model):
    user = ForeignKey(User, on_delete=CASCADE, related_name="follower")
    following = models.ManyToManyField(User, blank=True)

    def __str__(self) -> str:
        return f'{self.user} following {self.following.all()}'


