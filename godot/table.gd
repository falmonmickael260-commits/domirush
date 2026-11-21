extends Control

const IVORY := Color("#ffefd1")
const INK := Color("#163c33")
const GOLD := Color("#ddba70")
const FELT := Color("#102f27")
const PIPS := [
	[], [Vector2(1, 1)], [Vector2(0, 0), Vector2(2, 2)],
	[Vector2(0, 0), Vector2(1, 1), Vector2(2, 2)],
	[Vector2(0, 0), Vector2(2, 0), Vector2(0, 2), Vector2(2, 2)],
	[Vector2(0, 0), Vector2(2, 0), Vector2(1, 1), Vector2(0, 2), Vector2(2, 2)],
	[Vector2(0, 0), Vector2(2, 0), Vector2(0, 1), Vector2(2, 1), Vector2(0, 2), Vector2(2, 2)],
]

var tiles: Array = []
var bridge: JavaScriptObject

func _ready() -> void:
	resized.connect(queue_redraw)
	if OS.has_feature("web"):
		bridge = JavaScriptBridge.create_callback(_receive)
		var window := JavaScriptBridge.get_interface("window")
		window.addEventListener("message", bridge)
		window.parent.postMessage("domirush:ready", window.location.origin)

func _receive(args: Array) -> void:
	var event: JavaScriptObject = args[0]
	var window := JavaScriptBridge.get_interface("window")
	if event.origin != window.location.origin or event.data == null or event.data.type != "domirush:board":
		return
	var snapshot: Variant = JSON.parse_string(event.data.tiles)
	if snapshot is Array:
		tiles = snapshot
		queue_redraw()

# Evaluate each row capacity against both viewport dimensions. A long chain
# wraps in a continuous zigzag, keeping the original order and both ends visible.
func fit_board(count: int, available: Vector2) -> Vector2:
	var best := Vector2(1, 0)
	for columns in range(1, count + 1):
		var rows := ceili(float(count) / columns)
		var units := Vector2(columns * 2.14 + 0.88, rows * 1.62 - 0.62)
		var width := minf(44.0, minf(available.x / units.x, available.y / units.y))
		if width > best.y or (is_equal_approx(width, best.y) and columns > best.x):
			best = Vector2(columns, width)
	return best

func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, size), FELT)
	for x in range(12, int(size.x), 16):
		for y in range(12, int(size.y), 16):
			draw_circle(Vector2(x, y), 0.65, Color(1, 1, 1, 0.10))
	if tiles.is_empty():
		var font := ThemeDB.fallback_font
		var title := "Premier domino"
		var origin := size / 2.0 - Vector2(font.get_string_size(title, HORIZONTAL_ALIGNMENT_LEFT, -1, 16).x / 2.0, -5)
		draw_string(font, origin, title, HORIZONTAL_ALIGNMENT_LEFT, -1, 16, GOLD)
		return

	var fit := fit_board(tiles.size(), (size - Vector2(20, 18)).max(Vector2.ONE))
	var columns := int(fit.x)
	var unit := fit.y
	var rows := ceili(float(tiles.size()) / columns)
	var step := Vector2(2.14, 1.62) * unit
	var first := size / 2.0 - Vector2((columns - 1) * step.x, (rows - 1) * step.y) / 2.0
	for index in tiles.size():
		var row := floori(float(index) / columns)
		var reverse := row % 2 == 1
		var column := index % columns
		var center := first + Vector2(columns - 1 - column if reverse else column, row) * step
		if column == 0 and row > 0:
			var outside := Vector2((-1.38 if reverse == false else 1.38) * unit, 0)
			var edge := center + Vector2(signf(outside.x) * unit, 0)
			var previous := edge - Vector2(0, step.y)
			draw_polyline(PackedVector2Array([previous, center - Vector2(0, step.y) + outside, center + outside, edge]), GOLD, 1.5, true)
		var tile: Array = tiles[index]
		draw_tile(center, unit, int(tile[1] if reverse else tile[0]), int(tile[0] if reverse else tile[1]))

func draw_tile(center: Vector2, unit: float, left: int, right: int) -> void:
	var face := StyleBoxFlat.new()
	face.bg_color = IVORY
	face.border_color = GOLD
	face.set_border_width_all(1)
	face.set_corner_radius_all(maxi(2, roundi(unit * 0.16)))
	face.shadow_color = Color(0, 0, 0, 0.42)
	face.shadow_size = 3
	face.shadow_offset = Vector2(0, 2)
	draw_style_box(face, Rect2(center - Vector2(unit, unit / 2.0), Vector2(unit * 2.0, unit)))
	draw_line(center - Vector2(0, unit * 0.32), center + Vector2(0, unit * 0.32), INK, 1.0, true)
	draw_pips(center - Vector2(unit / 2.0, 0), left, unit)
	draw_pips(center + Vector2(unit / 2.0, 0), right, unit)

func draw_pips(center: Vector2, value: int, unit: float) -> void:
	for pip: Vector2 in PIPS[clampi(value, 0, 6)]:
		draw_circle(center + (pip - Vector2.ONE) * unit * 0.23, unit * 0.074, INK, true, -1, true)
