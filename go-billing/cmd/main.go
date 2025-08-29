package main

import (
	"log"
	"net/http"

	"billing-engine/internal/data"

	"github.com/gin-gonic/gin"
)

func main() {

	if err := data.InitDB(); err != nil {
		log.Fatalf("failed to initialize database: %v", err)
	}

	router := gin.Default()
	router.GET("/ping", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})
	router.Run()
}
