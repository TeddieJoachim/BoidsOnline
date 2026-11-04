# compiler
EMCC = emcc 

# -lm links math library
# -Wall turns on compiler warnings
# -O2 enables compiler optimization, 
# -sMODULARIZE=1 wraps the generated javascript in a function that can generate the module
# -sEXPORTED_RUNTIME_METHODS=HEAPU8 gives us access to shared heap memory
# -sEXPORT_NAME names the function that will load the module
CFLAGS = -lm -Wall -O2 -sMODULARIZE=1 -sEXPORTED_RUNTIME_METHODS=HEAPU8 -sEXPORT_NAME=createWASMModule 

TARGET = build/boidRunner.js

all: $(TARGET)

$(TARGET): src/boids.c src/vector.c
	$(EMCC) src/boids.c src/vector.c $(CFLAGS) -o $(TARGET)

serve: all 
	python3 -m http.server 8000 

clean:
	rm -r build/boidRunner.js build/boidRunner.wasm 
