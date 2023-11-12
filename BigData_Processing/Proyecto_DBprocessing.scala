// Databricks notebook source
import org.apache.spark.sql.{DataFrame, SparkSession}
import org.apache.spark.sql.functions._
import org.apache.spark.sql.expressions.Window

// Configuración de Spark en Databricks
val spark = SparkSession.builder()
  .appName("ScalaSparkCSV")
  .getOrCreate()

// Rutas de los archivos CSV en Databricks
val wh_2021_path = "/FileStore/shared_uploads/anel93_miel@hotmail.com/world_happiness_report_2021-1.csv"
val wh_b2021_path = "/FileStore/shared_uploads/anel93_miel@hotmail.com/world_happiness_report-1.csv"  

// Carga de archivos CSV con encabezado
val wh_2021: DataFrame = spark.read.option("header", "true").option("inferSchema", "true").csv(wh_2021_path)
val wh_b2021: DataFrame = spark.read.option("header", "true").option("inferSchema", "true").csv(wh_b2021_path)


// COMMAND ----------

// 1. ¿Cuál es el país más feliz del 2021?

val pais_mas_feliz_2021 = wh_2021.orderBy(col("Ladder score").desc).select("Country name").first().getString(0)

println(s"El país más 'feliz' del 2021 fue: $pais_mas_feliz_2021")

// COMMAND ----------

// 2. ¿Cuál es el país más feliz por continente del 2021?

val maxLadderScore = wh_2021.groupBy("Regional indicator")
  .agg(max("Ladder score").alias("max_score"))

val paises_mas_felices_por_region = wh_2021.join(
  maxLadderScore,
  Seq("Regional indicator"),
  "inner"
).where(col("Ladder score") === col("max_score"))
  .select("Regional indicator", "Country name", "Ladder score")

display(paises_mas_felices_por_region)

// COMMAND ----------


// 3. ¿Cuál es el país que más veces ocupó el primer lugar en todos los años?

val topCountriesDF = wh_b2021.groupBy("year", "Country name")
  .agg(max("Life Ladder").alias("maxLifeLadder"))

// Para cada año, encuentra el país con el Life Ladder más alto
val maxLifeLadderByYear = topCountriesDF.groupBy("year")
  .agg(max("maxLifeLadder").alias("maxLifeLadder"))
  .join(topCountriesDF, Seq("year", "maxLifeLadder"))
  .select("year", "Country name", "maxLifeLadder")

// Cuenta la frecuencia de cada país
val countryCounts = maxLifeLadderByYear.groupBy("Country name")
  .count()
  .withColumnRenamed("count", "countryCount")

// Encuentra el país con la frecuencia máxima
val mostFrequentCountry = countryCounts.orderBy(desc("countryCount")).first()

// Imprime el resultado
println(s"El país que más veces ocupó el primer lugar todos los años fue: ${mostFrequentCountry.getAs[String]("Country name")} con ${mostFrequentCountry.getAs[Long]("countryCount")} ocurrencias.")


// COMMAND ----------

// 4. ¿Qué puesto de Felicidad tiene el país con mayor GDP del 2020?

val year_2020 = wh_b2021.filter("year = 2020")
val pais_mayor_gdp_2020 = year_2020.orderBy(col("Log GDP per capita").desc).select("Country name").first().getString(0)

// Ranking de felicidad para el país con mayor 'Log GDP per capita' en 2020
val year_2020_sorted = year_2020.orderBy(col("Life Ladder").desc).select("Country name").collect().map(_.getString(0))
val posicion_max_GDP_country = year_2020_sorted.indexOf(pais_mayor_gdp_2020) + 1

println(s"En el año 2020, el país con el mayor 'Log GDP per capita' es '$pais_mayor_gdp_2020'.")
println(s"En el ranking de felicidad, este país ocuparía el puesto $posicion_max_GDP_country.")

// COMMAND ----------

// 5. ¿En que porcentaje a variado a nivel mundial el GDP promedio del 2020 respecto al 2021? ¿Aumentó o disminuyó?

val promedio_gdp_2020 = year_2020.select(avg("Log GDP per capita")).first().getDouble(0)
val promedio_gdp_2021 = wh_2021.select(avg("Logged GDP per capita")).first().getDouble(0)

// Porcentaje de variación
val porcentaje_variacion = ((promedio_gdp_2021 - promedio_gdp_2020) / promedio_gdp_2020) * 100

println(s"El promedio de GDP para el año 2020 es: $promedio_gdp_2020")
println(s"El promedio de GDP para el año 2021 es: $promedio_gdp_2021")
println(s"El porcentaje de variación entre 2020 y 2021 es: $porcentaje_variacion%")

if (porcentaje_variacion > 0) {
  println(s"El GDP ha aumentado en un ${Math.abs(porcentaje_variacion)}%.")
} else if (porcentaje_variacion < 0) {
    println(s"El GDP ha disminuido en un ${Math.abs(porcentaje_variacion)}%.")
  } else {
    println("El GDP no ha experimentado cambios significativos.")
    }


// COMMAND ----------

// 6. ¿Cuál es el país con mayor expectativa de vida (“Healthy life expectancy at birth”)? Y ¿Cuánto tenía en ese indicador en el 2019?

// País con la mayor expectativa de vida en 2021
val pais_mayor_expectativa_2021 = wh_2021.orderBy(col("Healthy life expectancy").desc).select("Country name").first().getString(0)

// Puntuación de expectativa de vida en 2019
val datos_pais_mayor_expectativa_2019 = wh_b2021.filter(s"(`Country name` = '$pais_mayor_expectativa_2021') AND (year = 2019)")
val puntuacion_expectativa_2019 = datos_pais_mayor_expectativa_2019.select("Healthy life expectancy at birth").first().getDouble(0)

println(s"En el año 2021, el país con la mayor expectativa de vida es '$pais_mayor_expectativa_2021'.")
println(s"En 2019, este país obtuvo una puntuación de '$puntuacion_expectativa_2019'.")

