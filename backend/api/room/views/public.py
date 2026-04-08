from django.db.models import Exists, OuterRef
from rest_framework.views import APIView
from rest_framework import status
from api.room.models import Room
from api.room.wishlist.models import Wishlist
from config.utils import SuccessResponse, ErrorResponse

from ..serializers import (
    PublicRoomSerializer,
    PublicRoomListQuerySerializer,
    PublicRoomSearchQuerySerializer,
    FeaturedRoomQuerySerializer,
)
from ..services import RoomService
from .pagination import RoomPagination


class RoomPublicListView(APIView):
    """
    GET /api/rooms/public/
    Truly unauthenticated — no token required.
    Always forces is_active=True. Uses PublicRoomSerializer (no pricing_rules/availabilities).
    Paginated.
    """

    permission_classes = []
    authentication_classes = []

    def get(self, request):
        query_serializer = PublicRoomListQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)

        filters = query_serializer.validated_data.copy()
        filters["is_active"] = True

        queryset = RoomService.list_rooms(filters=filters)

        if request.user.is_authenticated:
            queryset = queryset.annotate(
                is_wishlisted=Exists(
                    Wishlist.objects.filter(user=request.user, room=OuterRef("pk"))
                )
            )

        paginator = RoomPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = PublicRoomSerializer(
                page, many=True, context={"request": request}
            )
            return SuccessResponse(data=serializer.data)

        serializer = PublicRoomSerializer(
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
        try:
            room = RoomService.get_room(pk)
            if not room.is_active:
                return ErrorResponse(
                    message="Not found.", status_code=status.HTTP_404_NOT_FOUND
                )
            serializer = PublicRoomSerializer(room, context={"request": request})
            return SuccessResponse(data=serializer.data)
        except Room.DoesNotExist:
            return ErrorResponse(
                message="Not found.", status_code=status.HTTP_404_NOT_FOUND
            )


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

        queryset = RoomService.search_public_rooms(filters=filters)

        if request.user.is_authenticated:
            queryset = queryset.annotate(
                is_wishlisted=Exists(
                    Wishlist.objects.filter(user=request.user, room=OuterRef("pk"))
                )
            )

        paginator = RoomPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = PublicRoomSerializer(
                page, many=True, context={"request": request}
            )
            return SuccessResponse(data=serializer.data)

        serializer = PublicRoomSerializer(
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
            filters=validated, limit=limit
        )
        if request.user.is_authenticated:
            queryset = queryset.annotate(
                is_wishlisted=Exists(
                    Wishlist.objects.filter(user=request.user, room=OuterRef("pk"))
                )
            )
        serializer = PublicRoomSerializer(
            queryset, many=True, context={"request": request}
        )
        return SuccessResponse(data=serializer.data)
