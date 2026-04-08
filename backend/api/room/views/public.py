from rest_framework.views import APIView
from rest_framework import status
from api.room.models import Room
from config.utils import SuccessResponse, ErrorResponse

from ..serializers import (
    PublicRoomSerializer,
    PublicRoomCardSerializer,
    PublicRoomListQuerySerializer,
    PublicRoomSearchQuerySerializer,
    FeaturedRoomQuerySerializer,
)
from ..services import RoomService
from ..services.RoomService import get_detail_room
from .pagination import RoomPagination


class RoomPublicListView(APIView):
    """
    GET /api/rooms/public/
    Truly unauthenticated — no token required.
    Always forces is_active=True. Uses PublicRoomCardSerializer.
    Paginated.
    """

    permission_classes = []
    authentication_classes = []

    def get(self, request):
        query_serializer = PublicRoomListQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)

        filters = query_serializer.validated_data.copy()

        queryset = RoomService.search_public_rooms(filters=filters, user=request.user)

        paginator = RoomPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = PublicRoomCardSerializer(
                page, many=True, context={"request": request}
            )
            return SuccessResponse(data=serializer.data)

        serializer = PublicRoomCardSerializer(
            queryset, many=True, context={"request": request}
        )
        return SuccessResponse(data=serializer.data)


class RoomPublicDetailView(APIView):
    """
    GET /api/rooms/public/<pk>/
    Truly unauthenticated. Returns 404 if room is inactive.
    Uses PublicRoomSerializer.
    """

    permission_classes = []
    authentication_classes = []

    def get(self, request, pk):
        room = get_detail_room(pk, request.user)
        if room is None:
            return ErrorResponse(
                message="Not found.", status_code=status.HTTP_404_NOT_FOUND
            )
        serializer = PublicRoomSerializer(room, context={"request": request})
        return SuccessResponse(data=serializer.data)


class RoomPublicSearchView(APIView):
    """
    GET /api/rooms/public/search/
    Public room search with optional filters:
      - location (icontains)
      - check_in + check_out (availability window)
      - guests (capacity >= guests)
      - min_price/max_price
      - featured (optional featured-only toggle)
    """

    permission_classes = []
    authentication_classes = []

    def get(self, request):
        query_serializer = PublicRoomSearchQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        filters = query_serializer.validated_data.copy()

        featured = filters.pop("featured", False)
        if featured:
            filters["featured_only"] = True

        queryset = RoomService.search_public_rooms(filters=filters, user=request.user)

        paginator = RoomPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = PublicRoomCardSerializer(
                page, many=True, context={"request": request}
            )
            return SuccessResponse(data=serializer.data)

        serializer = PublicRoomCardSerializer(
            queryset, many=True, context={"request": request}
        )
        return SuccessResponse(data=serializer.data)


class RoomPublicFeaturedView(APIView):
    """
    GET /api/rooms/public/featured/
    Public list of featured active rooms ordered by rating and ratings_count.
    Supports optional room filters + limit.
    """

    permission_classes = []
    authentication_classes = []

    def get(self, request):
        query_serializer = FeaturedRoomQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)

        validated = query_serializer.validated_data.copy()
        limit = validated.pop("limit", 6)

        queryset = RoomService.list_featured_public_rooms(
            filters=validated, user=request.user, limit=limit
        )
        serializer = PublicRoomCardSerializer(
            queryset, many=True, context={"request": request}
        )
        return SuccessResponse(data=serializer.data)
