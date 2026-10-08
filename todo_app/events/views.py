from django.shortcuts import render
from django.http import JsonResponse, HttpResponseNotAllowed, HttpResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils import timezone
from django.db.models import Count, Q
# from django.template import loader

import json
from datetime import date
from events.models import Todo, Tag
from events.serializers import serialize_todo, serialize_tag

@ensure_csrf_cookie
def spa_shell(request):
    return render(request, 'events/index.html')
    # template = loader.get_template('events/index.html')
    # return HttpResponse(template.render())


def error_boundary(request):
    """Preview the fallback shell.

    Every context key is optional; templates/fallback/errorBoundary.html
    supplies defaults for all of them.
    """
    return render(request, 'events/errorBoundary.html', {
        "severity": request.GET.get('severity', 'error'),
        "code": "ERR_FALLBACK",
        "retry_url": "/",
        "home_url": "/",
    })

def _json_body(request):
    """Return (payload, error_response). On success error_response is None."""
    try:
        payload = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return None, JsonResponse({"detail": "Invalid JSON body"}, status=400)
    if not isinstance(payload, dict):
        return None, JsonResponse({"detail": "Body must be a JSON object"}, status=400)
    return payload, None
def create_todo(request):
    payload, err = _json_body(request)
    if err:
        return err

    # title (required)
    title = payload.get("title")
    if not isinstance(title, str) or not title.strip():
        return JsonResponse({"title": ["This field is required."]}, status=400)

    # priority (optional, default medium, whitelist)
    priority = payload.get("priority", Todo.Priority.MEDIUM)
    if priority not in Todo.Priority.values:
        return JsonResponse({"priority": ["Choose a valid choice."]}, status=400)

    # status (optional, default todo, whitelist)
    status = payload.get("status", Todo.Status.TODO)
    if status not in Todo.Status.values:
        return JsonResponse({"status": ["Choose a valid choice."]}, status=400)

    # due_date (optional, 'YYYY-MM-DD' or null)
    due_date = payload.get("due_date")
    if due_date is not None:
        if not isinstance(due_date, str):
            return JsonResponse({"due_date": ["Enter a valid date or null."]}, status=400)
        try:
            due_date = date.fromisoformat(due_date)
        except ValueError:
            return JsonResponse({"due_date": ["Enter a valid date."]}, status=400)

    tags = payload.get("tag_ids", [])
    if not isinstance(tags, list) or not all(isinstance(t, int) for t in tags):
        return JsonResponse({"tag_ids": ["Expected a list of integers."]}, status=400)
    if Tag.objects.filter(id__in=tags).count() != len(tags):
        return JsonResponse({"tag_ids": ["One or more tags do not exist."]}, status=400)

    description = payload.get("description", "")
    if not isinstance(description, str):
        return JsonResponse({"description": ["Enter a valid string."]}, status=400)

    position = payload.get("position", 0)
    if not isinstance(position, int) or isinstance(position, bool):
        return JsonResponse({"position": ["Enter an integer."]}, status=400)
    todo = Todo(
        title=title.strip(),
        description=description,
        priority=priority,
        status=status,
        due_date=due_date,
        position=payload.get("position", 0),
    )
    if status == Todo.Status.DONE:
        todo.completed_at = timezone.now()
    todo.save()
    todo.tags.set(tags)

    return JsonResponse(serialize_todo(todo), status=201)

def todo_detail(request, pk):
    try:
        todo = Todo.objects.get(pk=pk)
    except Todo.DoesNotExist:
        return JsonResponse({"detail": "Not found."}, status=404)

    if request.method == "PATCH":
        payload, err = _json_body(request)
        if err:
            return err
        for field in ["title", "description", "priority", "status", "position"]:
            if field in payload:
                val = payload[field]
                if field == "priority" and val not in Todo.Priority.values:
                    return JsonResponse({"priority": ["Choose a valid choice."]}, status=400)
                if field == "status" and val not in Todo.Status.values:
                    return JsonResponse({"status": ["Choose a valid choice."]}, status=400)
                if field == "title" and (not isinstance(val, str) or not val.strip()):
                    return JsonResponse({"title": ["This field may not be blank."]}, status=400)
                setattr(todo, field, val)
        if "due_date" in payload:
            val = payload["due_date"]
            if val is not None:
                try:
                    todo.due_date = date.fromisoformat(val)
                except (ValueError, TypeError):
                    return JsonResponse({"due_date": ["Enter a valid date."]}, status=400)
            else:
                todo.due_date = None
        if "tag_ids" in payload:
            ids = payload["tag_ids"]
            if Tag.objects.filter(id__in=ids).count() != len(ids):
                return JsonResponse({"tag_ids": ["One or more tags do not exist."]}, status=400)
            todo.tags.set(ids)
        # completed_at follows status
        if "status" in payload:
            if todo.status == Todo.Status.DONE and todo.completed_at is None:
                todo.completed_at = timezone.now()
            elif todo.status != Todo.Status.DONE:
                todo.completed_at = None
        todo.save()
        return JsonResponse(serialize_todo(todo))

    if request.method == "DELETE":
        todo.delete()
        return HttpResponse(status=204)

    if request.method == "GET":
        return JsonResponse(serialize_todo(todo))

    return HttpResponseNotAllowed(["GET", "PATCH", "DELETE"])
def todo_toggle(request, pk):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    try:
        todo = Todo.objects.get(pk=pk)
    except Todo.DoesNotExist:
        return JsonResponse({"detail": "Not found."}, status=404)
    if todo.status == Todo.Status.DONE:
        todo.status = Todo.Status.TODO
        todo.completed_at = None
    else:
        todo.status = Todo.Status.DONE
        todo.completed_at = timezone.now()
    todo.save()
    return JsonResponse(serialize_todo(todo))

def todos_api(request):
    if request.method == "POST":
        return create_todo(request)
    elif request.method != "GET":
        return JsonResponse({"message": "Method not allowed"}, status=405)

    todos = Todo.objects.prefetch_related("tags")
    # -----------------------------------
    # 1. Search
    # -----------------------------------
    search = request.GET.get("search")

    if search:
        todos = todos.filter(
            Q(title__icontains=search) | Q(description__icontains=search)
        )
    # -----------------------------------
    # 2. Status
    # -----------------------------------
    status = request.GET.get("status")

    if status:
        todos = todos.filter(
            status=status
        )
    # -----------------------------------
    # 3. Priority
    # -----------------------------------
    priority = request.GET.get("priority")

    if priority:
        todos = todos.filter(
            priority=priority
        )
    # -----------------------------------
    # 4. Tag IDs
    # -----------------------------------
    tag_ids = request.GET.get("tag_ids")

    if tag_ids:
        try:
            tag_id_list = [
                int(tag_id)
                for tag_id in tag_ids.split(",")
            ]

            todos = todos.filter(
                tags__id__in=tag_id_list
            ).distinct()

        except ValueError:
            return JsonResponse(
                {
                    "status": False,
                    "message": "Invalid tag_ids"
                },
                status=400
            )
    # -----------------------------------
    # 5. Overdue only
    # -----------------------------------
    overdue_only = request.GET.get("overdue_only")

    if overdue_only in {"true", "1", "yes"}:
        today = timezone.localdate()

        todos = todos.filter(
            due_date__lt=today
        ).exclude(
            status=Todo.Status.DONE
        )
    # -----------------------------------
    # 6. Due before
    # -----------------------------------
    due_before = request.GET.get("due_before")

    if due_before:
        todos = todos.filter(
            due_date__lte=due_before
        )
    # -----------------------------------
    # 7. Ordering
    # -----------------------------------
    ordering = request.GET.get("ordering")

    allowed_ordering = {
        "title": "title",
        "priority": "priority",
        "status": "status",
        "due_date": "due_date",
        "position": "position",
        "created_at": "created_at",
        "updated_at": "updated_at",
    }

    if ordering:
        # Example:
        # ordering=title
        # ordering=-title

        descending = ordering.startswith("-")
        field = ordering.lstrip("-")

        if field not in allowed_ordering:
            return JsonResponse(
                {
                    "status": False,
                    "message": "Invalid ordering field"
                },
                status=400
            )

        ordering_field = allowed_ordering[field]

        if descending:
            ordering_field = f"-{ordering_field}"

        todos = todos.order_by(ordering_field)
    # -----------------------------------
    # Serialize
    # -----------------------------------
    data = [
        serialize_todo(todo)
        for todo in todos
    ]

    return JsonResponse(data, safe=False)


def stats_api(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    today = timezone.localdate()

    totals = Todo.objects.aggregate(
        total=Count("id"),
        todo=Count("id", filter=Q(status=Todo.Status.TODO)),
        in_progress=Count("id", filter=Q(status=Todo.Status.INPROGRESS)),
        done=Count("id", filter=Q(status=Todo.Status.DONE)),
        overdue=Count("id", filter=Q(due_date__lt=today) & ~Q(status=Todo.Status.DONE)),
        due_today=Count("id", filter=Q(due_date=today)),
    )
    completion_rate = int(totals["done"] * 100 / totals["total"]) if totals["total"] else 0
    by_priority = {p: 0 for p in Todo.Priority.values}
    for row in Todo.objects.values("priority").annotate(n=Count("id")):
        by_priority[row["priority"]] = row["n"]
    return JsonResponse({
        **totals,
        "completion_rate": completion_rate,
        "by_priority": by_priority,
    })


def tags_api(request):
    if request.method == "GET":
        tags = Tag.objects.annotate(todo_count=Count("todos")).order_by("name")
        return JsonResponse([
            serialize_tag(t, todo_count=t.todo_count) for t in tags
        ], safe=False)
    if request.method == "POST":
        payload, err = _json_body(request)
        if err:
            return err
        name = payload.get("name")
        color = payload.get("color", "#52eb87")
        if not isinstance(name, str) or not name.strip():
            return JsonResponse({"name": ["This field is required."]}, status=400)
        if Tag.objects.filter(name__iexact=name.strip()).exists():
            return JsonResponse({"name": ["A tag with this name already exists."]}, status=400)
        tag = Tag.objects.create(name=name.strip(), color=color)
        return JsonResponse(serialize_tag(tag, todo_count=0), status=201)
    return HttpResponseNotAllowed(["GET", "POST"])


def tag_detail(request, pk):
    try:
        tag = Tag.objects.get(pk=pk)
    except Tag.DoesNotExist:
        return JsonResponse({"detail": "Not found."}, status=404)
    if request.method == "PATCH":
        payload, err = _json_body(request)
        if err:
            return err
        if "name" in payload:
            name = payload["name"]
            if not isinstance(name, str) or not name.strip():
                return JsonResponse({"name": ["This field may not be blank."]}, status=400)
            if Tag.objects.filter(name__iexact=name.strip()).exclude(pk=tag.pk).exists():
                return JsonResponse({"name": ["A tag with this name already exists."]}, status=400)
            tag.name = name.strip()
        if "color" in payload:
            tag.color = payload["color"]
        tag.save()
        return JsonResponse(serialize_tag(tag, todo_count=Todo.objects.filter(tags=tag).count()))
    if request.method == "DELETE":
        tag.delete()
        return HttpResponse(status=204)
    return HttpResponseNotAllowed(["GET", "PATCH", "DELETE"])

def reorder_api(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    payload, err = _json_body(request)
    if err:
        return err
    items = payload.get("items")
    if not isinstance(items, list) or not all(
        isinstance(i, dict) and isinstance(i.get("id"), int) and isinstance(i.get("position"), int)
        for i in items
    ):
        return JsonResponse({"items": ["Expected a list of {id, position}."]}, status=400)
    for item in items:
        Todo.objects.filter(pk=item["id"]).update(position=item["position"])
    return HttpResponse(status=204)