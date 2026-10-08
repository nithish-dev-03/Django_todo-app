def serialize_tag(tag, todo_count=None):
    data = {
        "id": tag.id,
        "name": tag.name,
        "color": tag.color,
    }

    if todo_count is not None:
        data["todo_count"] = todo_count

    return data


def serialize_todo(todo, tags=None):
    if tags is None:
        tags = todo.tags.all()

    return {
        "id": todo.id,
        "title": todo.title,
        "description": todo.description,
        "priority": todo.priority,
        "status": todo.status,
        "due_date": todo.due_date.isoformat() if todo.due_date else None,
        "position": todo.position,
        "completed_at": (
            todo.completed_at.isoformat()
            if todo.completed_at
            else None
        ),
        "created_at": todo.created_at.isoformat(),
        "updated_at": todo.updated_at.isoformat(),
        "tags": [
            serialize_tag(tag)
            for tag in tags
        ],
    }