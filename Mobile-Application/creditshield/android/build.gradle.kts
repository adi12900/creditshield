allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url = uri("file://${System.getenv("HOME")}/.m2/repository") }
        maven { url = uri("file://${System.getenv("HOME")}/Android/Sdk/extras/android/m2repository") }
        maven { url = uri("file://${System.getenv("HOME")}/Android/Sdk/extras/google/m2repository") }
    }
}

val newBuildDir: Directory = rootProject.layout.buildDirectory.dir("../../build").get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
