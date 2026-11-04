//#include "../src/boids.h"
#include <stdio.h>
#include <stdlib.h>

float randomInRange(float min, float max) 
{
  float intervalSize = max - min;
  float normalized = (float)rand() / (float)RAND_MAX; // [0.0, 1.0]
  float scaled = normalized * intervalSize; // [0.0, max-min (20)]

  return scaled + min; // shift so that 0.0 -> min (-10)
}

int main(void) {
  //int numIters = 1000;
  //float delT = 1.0/60.0;

  //initializeBoids();

  //for (int i = 0; i < numIters; i++) advanceBoids(delT);

  //freeBoids();
  for (long i = 0; i < 10000000; i++)
  {
    if (randomInRange(-1.0, 1.0) > 1.0) printf("i am the problem\n");
  }
  return 0;
}