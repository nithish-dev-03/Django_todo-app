from django.db import models

# Create your models here.
class Tag(models.Model):
    name = models.CharField(max_length=30)
    color = models.CharField(max_length=7,default='#52eb87')

    class Meta:
        ordering = ['name']

class Todo(models.Model):
    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"
    
    class Status(models.TextChoices):
        TODO= "todo", "Todo"
        INPROGRESS = "in_progress", "In Progress"
        DONE="done","Done"

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True,default='')
    priority = models.CharField(
        max_length=10,
        choices=Priority,
        default=Priority.MEDIUM
    )
    status = models.CharField(
        max_length=15,
        choices=Status,
        default=Status.TODO
    )
    due_date = models.DateField(
        null=True,
        blank=True
    )
    position = models.IntegerField(
        default=0,
        db_index=True
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )
    tags = models.ManyToManyField(
        Tag,
        related_name="todos",
        blank=True
    )

    class Meta:
        ordering = ["position", "-created_at"]
