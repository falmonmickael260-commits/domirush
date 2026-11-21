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
var face_color := IVORY
var edge_color := GOLD
var pip_color := INK
var felt_color := FELT
var accent_color := GOLD
var engraving: Dictionary = {}
var board_illustration: Array = []
var highlighted_id: String = ""
var received_snapshot := false
var glow_time := 0.0
const GLOW_DURATION := 0.92
const IMPACT_DELAY := 0.14
var bridge: JavaScriptObject

func _ready() -> void:
	resized.connect(queue_redraw)
	set_process(false)
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
		if received_snapshot and event.data.effects == true and snapshot.size() == tiles.size() + 1:
			var previous_ids: Array = tiles.map(func(tile: Array): return tile[2] if tile.size() > 2 else "")
			for tile: Array in snapshot:
				if tile.size() > 2 and tile[2] == event.data.effectTileId and not previous_ids.has(tile[2]):
					highlighted_id = str(tile[2])
					glow_time = GLOW_DURATION
					set_process(true)
					break
		elif snapshot.size() != tiles.size() or snapshot.is_empty():
			glow_time = 0.0
			set_process(false)
		tiles = snapshot
		received_snapshot = true
		if event.data.palette is String:
			var palette: Variant = JSON.parse_string(event.data.palette)
			if palette is Dictionary:
				face_color = Color.from_string(str(palette.get("face")), IVORY)
				edge_color = Color.from_string(str(palette.get("edge")), GOLD)
				pip_color = Color.from_string(str(palette.get("pip")), INK)
				felt_color = Color.from_string(str(palette.get("felt")), FELT)
				accent_color = Color.from_string(str(palette.get("accent")), GOLD)
				var ornament: Variant = palette.get("engraving")
				engraving = ornament if ornament is Dictionary else {}
				var illustration: Variant = palette.get("illustration")
				board_illustration = illustration if illustration is Array else []
		queue_redraw()

func _process(delta: float) -> void:
	glow_time = maxf(0.0, glow_time - delta)
	queue_redraw()
	if glow_time <= 0.0:
		set_process(false)

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

func draw_board_illustration() -> void:
	if board_illustration.is_empty():
		return
	var extent := minf(size.x, size.y)
	var color := Color(accent_color, 0.34)
	draw_rect(Rect2(Vector2(5, 5), (size - Vector2(10, 10)).max(Vector2.ZERO)), Color(accent_color, 0.20), false, 1.0)
	for position: Vector2 in [size / 2.0, size * Vector2(0.15, 0.52), size * Vector2(0.85, 0.52)]:
		var scale_factor := extent * (0.91 if position.is_equal_approx(size / 2.0) else 0.29) / 100.0
		for stroke: Array in board_illustration:
			var path := PackedVector2Array()
			for point: Array in stroke:
				path.append(position + (Vector2(float(point[0]), float(point[1])) - Vector2(50, 50)) * scale_factor)
			draw_polyline(path, color, maxf(1.0, scale_factor * 1.65), true)

func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, size), felt_color)
	for x in range(12, int(size.x), 16):
		for y in range(12, int(size.y), 16):
			draw_circle(Vector2(x, y), 0.65, Color(1, 1, 1, 0.10))
	draw_board_illustration()
	if tiles.is_empty():
		var font := ThemeDB.fallback_font
		var title := "Premier domino"
		var origin := size / 2.0 - Vector2(font.get_string_size(title, HORIZONTAL_ALIGNMENT_LEFT, -1, 16).x / 2.0, -5)
		draw_string(font, origin, title, HORIZONTAL_ALIGNMENT_LEFT, -1, 16, accent_color)
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
			draw_polyline(PackedVector2Array([previous, center - Vector2(0, step.y) + outside, center + outside, edge]), accent_color, 1.5, true)
		var tile: Array = tiles[index]
		var landing := glow_time > 0.0 and tile.size() > 2 and str(tile[2]) == highlighted_id and not engraving.is_empty()
		var tile_center := center
		var tile_size := unit
		if landing:
			var elapsed := GLOW_DURATION - glow_time
			var lift := clampf(1.0 - elapsed / IMPACT_DELAY, 0.0, 1.0)
			var squash := maxf(0.0, 1.0 - absf(elapsed - IMPACT_DELAY - 0.035) / 0.035)
			tile_center.y -= minf(unit * 0.33, 14.0) * lift * lift
			tile_size *= 1.0 + lift * 0.16 - squash * 0.06
			if elapsed >= IMPACT_DELAY:
				draw_placement_glow(center, unit, (elapsed - IMPACT_DELAY) / (GLOW_DURATION - IMPACT_DELAY))
		draw_tile(tile_center, tile_size, int(tile[1] if reverse else tile[0]), int(tile[0] if reverse else tile[1]))

func draw_tile(center: Vector2, unit: float, left: int, right: int) -> void:
	var face := StyleBoxFlat.new()
	face.bg_color = face_color
	face.border_color = edge_color
	face.set_border_width_all(1)
	face.set_corner_radius_all(maxi(2, roundi(unit * 0.16)))
	face.shadow_color = Color(0, 0, 0, 0.42)
	face.shadow_size = 3
	face.shadow_offset = Vector2(0, 2)
	draw_style_box(face, Rect2(center - Vector2(unit, unit / 2.0), Vector2(unit * 2.0, unit)))
	if unit >= 15.0 and not engraving.is_empty():
		draw_engraving(center, unit)
	draw_line(center - Vector2(0, unit * 0.32), center + Vector2(0, unit * 0.32), pip_color, 1.0, true)
	draw_pips(center - Vector2(unit / 2.0, 0), left, unit)
	draw_pips(center + Vector2(unit / 2.0, 0), right, unit)

func draw_placement_glow(center: Vector2, unit: float, progress: float) -> void:
	var color := Color.from_string(str(engraving.get("burstColor", engraving.get("color"))), accent_color)
	var strength := 1.0 - progress
	var effect := str(engraving.get("effect"))
	var reach := maxf(19.0, unit)
	draw_circle(center, reach * (0.28 + progress * 0.55), Color(color, strength * strength * 0.23), true, -1.0, true)
	for index in 2:
		var wave := progress - float(index) * 0.16
		if wave < 0:
			continue
		var radius := reach * (0.44 + wave * 1.28)
		draw_set_transform(center, 0.0, Vector2(1.28, 0.66))
		draw_arc(Vector2.ZERO, radius, 0, TAU, 36, Color(color, strength * (0.8 - index * 0.25)), 1.7, true)
		draw_set_transform(Vector2.ZERO)

	for index in 14:
		var angle := TAU * float(index) / 14.0
		if effect == "orbit" or effect == "petals":
			angle += progress * 1.45
		var direction := Vector2.from_angle(angle)
		var travel := 0.43 + progress * (0.9 + float(index % 3) * 0.33)
		var point := center + direction * Vector2(1.25, 0.86) * reach * travel
		if effect == "flame" or effect == "petals":
			point.y -= progress * reach * 0.7
		var radius := maxf(2.4, minf(5.0, unit * 0.12)) * (1.0 - progress * 0.45)
		var particle_color := Color(color.lightened(0.26 if index % 3 == 0 else 0.0), strength)
		draw_landing_particle(effect, point, direction, radius, particle_color, progress)

func draw_landing_particle(effect: String, point: Vector2, direction: Vector2, radius: float, color: Color, progress: float) -> void:
	var sideways := direction.orthogonal()
	match effect:
		"bolt":
			draw_polyline(PackedVector2Array([point - direction * 2.0 * radius, point + sideways * radius,
				point - sideways * radius, point + direction * 2.0 * radius]), color, 2.0, true)
		"crystals", "petals", "flame":
			var stretch := 2.1 if effect == "flame" else 1.45
			var axis := Vector2.UP if effect == "flame" else direction
			var wing := axis.orthogonal() * radius * (0.7 if effect == "petals" else 0.85)
			draw_colored_polygon(PackedVector2Array([point + axis * radius * stretch, point + wing,
				point - axis * radius, point - wing]), color)
		"stars", "sparks":
			draw_line(point - direction * radius, point + direction * radius, color, 1.6, true)
			draw_line(point - sideways * radius, point + sideways * radius, color, 1.6, true)
		"wave":
			draw_arc(point, radius + progress * 4.0, direction.angle() - 1.3, direction.angle() + 1.3, 9, color, 1.5, true)
		_:
			draw_circle(point, radius, color, false, 1.3, true)

func draw_engraving(center: Vector2, unit: float) -> void:
	var color := Color.from_string(str(engraving.get("color")), edge_color)
	color.a = 0.76
	for stroke: Array in engraving.get("strokes", []):
		var left := PackedVector2Array()
		var right := PackedVector2Array()
		for point: Array in stroke:
			var offset := Vector2(float(point[1]) - 100.0, 50.0 - float(point[0])) * (unit / 100.0)
			left.append(center + offset)
			right.append(center - offset)
		draw_polyline(left, color, maxf(0.7, unit * 0.025), true)
		draw_polyline(right, color, maxf(0.7, unit * 0.025), true)

func draw_pips(center: Vector2, value: int, unit: float) -> void:
	for pip: Vector2 in PIPS[clampi(value, 0, 6)]:
		draw_circle(center + (pip - Vector2.ONE) * unit * 0.23, unit * 0.074, pip_color, true, -1, true)
