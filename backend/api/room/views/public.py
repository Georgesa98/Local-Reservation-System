from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ..serializers import PublicRoomSerializer
from ..services import RoomService
from .pagination import RoomPagination


class RoomPublicListView(APIView):
    """
    GET /api/rooms/public/
    Truly unauthenticated — no token required.
    Always forces is_active=True. Uses PublicRoomSerializer (no pricing_rules/availabilities).
    Paginated.
    """

    permission_classes = []  # no auth required
    authentication_classes = []  # skip session/token authentication entirely

    def get(self, request):
        filters = {}
        if "location" in request.GET:
            filters["location"] = request.GET["location"]
        if "base_price_per_night" in request.GET:
            filters["base_price_per_night"] = request.GET["base_price_per_night"]
        if "capacity" in request.GET:
            filters["capacity"] = request.GET["capacity"]
        if "average_rating" in request.GET:
            filters["average_rating"] = request.GET["average_rating"]
        # Force is_active=True — guests must never see inactive rooms
        filters["is_active"] = True

        queryset = RoomService.list_rooms(filters=filters)

        paginator = RoomPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = PublicRoomSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = PublicRoomSerializer(queryset, many=True)
        return Response(serializer.data)


class RoomPublicDetailView(APIView):
    """
    GET /api/rooms/public/<pk>/
    Truly unauthenticated. Returns 404 if room is inactive.
    Uses PublicRoomSerializer.
    """

    permission_classes = []
    authentication_classes = []

    def get(self, request, pk):
        room = RoomService.get_room(pk)
        if not room.is_active:
            return Response(
                {"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = PublicRoomSerializer(room)
        return Response(serializer.data)
